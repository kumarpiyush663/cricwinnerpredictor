from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, status
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import re
from collections import defaultdict
import time
import asyncio
import resend
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24
JWT_EXTENDED_EXPIRY_DAYS = 7

# Resend Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# CricAPI Configuration
CRICAPI_KEY = os.environ.get('CRICAPI_KEY')
CRICAPI_BASE_URL = os.environ.get('CRICAPI_BASE_URL', 'https://api.cricapi.com/v1')

# Rate limiting storage
rate_limit_store: Dict[str, List[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # 1 minute
RATE_LIMIT_MAX_REQUESTS = 100  # Much more relaxed for testing

# Create the main app
app = FastAPI(title="Cricket Tournament Predictor League API")

# Create routers
api_router = APIRouter(prefix="/api")
admin_router = APIRouter(prefix="/api/admin")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class TournamentCreate(BaseModel):
    name: str
    format: str = Field(..., pattern="^(T20|ODI|Test)$")
    year: int
    start_date: str
    end_date: str
    teams: List[str]
    status: str = Field(default="upcoming", pattern="^(upcoming|active|completed)$")

class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    format: Optional[str] = None
    year: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    teams: Optional[List[str]] = None
    status: Optional[str] = None
    active_flag: Optional[bool] = None

class TournamentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    format: str
    year: int
    start_date: str
    end_date: str
    teams: List[str]
    status: str
    active_flag: bool
    created_at: str

class MatchCreate(BaseModel):
    tournament_id: str
    match_no: int
    stage: str = Field(..., pattern="^(Group|QF|SF|Final)$")
    team_a: str
    team_b: str
    venue: str
    start_datetime_ist: str

class MatchUpdate(BaseModel):
    match_no: Optional[int] = None
    stage: Optional[str] = None
    team_a: Optional[str] = None
    team_b: Optional[str] = None
    venue: Optional[str] = None
    start_datetime_ist: Optional[str] = None
    result_winner: Optional[str] = None
    status: Optional[str] = None

class MatchResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    tournament_id: str
    match_no: int
    stage: str
    team_a: str
    team_b: str
    venue: str
    start_datetime_ist: str
    result_winner: Optional[str] = None
    status: str
    created_at: str

class NominationCreate(BaseModel):
    full_name: str
    username: str
    email: EmailStr

class NominationBulkCreate(BaseModel):
    nominations: List[NominationCreate]

class NominationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    full_name: str
    username: str
    email: str
    invite_token: Optional[str] = None
    invite_sent_at: Optional[str] = None
    invite_expires_at: Optional[str] = None
    status: str
    created_at: str

class SignupRequest(BaseModel):
    token: str
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class LoginRequest(BaseModel):
    identifier: str  # email or username
    password: str
    remember_me: bool = False

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class PredictionCreate(BaseModel):
    match_id: str
    predicted_winner: str

class PredictionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    match_id: str
    predicted_winner: str
    submitted_at: str
    last_edited_at: str
    is_correct: Optional[bool] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    email: str
    full_name: str
    role: str
    created_at: str

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    full_name: str
    username: str
    correct_predictions: int
    total_predictions: int
    accuracy: float

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, role: str, extended: bool = False) -> str:
    expiry = datetime.now(timezone.utc) + (
        timedelta(days=JWT_EXTENDED_EXPIRY_DAYS) if extended else timedelta(hours=JWT_EXPIRY_HOURS)
    )
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expiry,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> Optional[Dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(request: Request) -> Dict:
    token = request.cookies.get("auth_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def get_admin_user(request: Request) -> Dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def check_rate_limit(ip: str) -> bool:
    current_time = time.time()
    # Clean old entries
    rate_limit_store[ip] = [t for t in rate_limit_store[ip] if current_time - t < RATE_LIMIT_WINDOW]
    if len(rate_limit_store[ip]) >= RATE_LIMIT_MAX_REQUESTS:
        return False
    rate_limit_store[ip].append(current_time)
    return True

async def send_email(to_email: str, subject: str, body: str):
    """Send email using Resend API"""
    if not RESEND_API_KEY:
        # Fallback to mock if no API key
        logger.info(f"\n{'='*50}")
        logger.info(f"📧 MOCK EMAIL (No Resend API Key)")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body:\n{body}")
        logger.info(f"{'='*50}\n")
        return
    
    try:
        # Convert plain text to HTML
        html_body = body.replace('\n', '<br>')
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #059669, #0f172a); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">🏏 Cricket Predictor League</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="color: #334155; line-height: 1.6;">{html_body}</p>
            </div>
            <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">
                Cricket Tournament Predictor League
            </p>
        </div>
        """
        
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        
        # Run sync SDK in thread to keep FastAPI non-blocking
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"📧 Email sent successfully to {to_email}, ID: {email_result.get('id')}")
        return email_result
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {str(e)}")
        # Log the email content as fallback
        logger.info(f"📧 Email content (failed to send):\nTo: {to_email}\nSubject: {subject}\nBody:\n{body}")

def get_ist_now() -> datetime:
    """Get current time in IST"""
    return datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)

def parse_ist_datetime(ist_str: str) -> datetime:
    """Parse IST datetime string to UTC datetime"""
    # Parse as naive datetime
    naive_dt = datetime.fromisoformat(ist_str.replace('Z', ''))
    # Subtract IST offset to get UTC
    utc_dt = naive_dt - timedelta(hours=5, minutes=30)
    return utc_dt.replace(tzinfo=timezone.utc)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/signup")
async def signup(request: Request, data: SignupRequest, response: Response):
    # Find nomination by token
    nomination = await db.nominations.find_one({"invite_token": data.token}, {"_id": 0})
    if not nomination:
        raise HTTPException(status_code=400, detail="Invalid invite token")
    
    if nomination["status"] == "registered":
        raise HTTPException(status_code=400, detail="This invite has already been used")
    
    # Check token expiry
    expires_at = datetime.fromisoformat(nomination["invite_expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Invite token has expired")
    
    # Check if username or email already exists
    existing = await db.users.find_one({
        "$or": [
            {"username": nomination["username"]},
            {"email": nomination["email"]}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "nomination_id": nomination["id"],
        "username": nomination["username"],
        "email": nomination["email"],
        "full_name": nomination["full_name"],
        "password_hash": hash_password(data.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    # Update nomination status
    await db.nominations.update_one(
        {"id": nomination["id"]},
        {"$set": {"status": "registered", "invite_token": None}}
    )
    
    # Create JWT and set cookie
    token = create_jwt_token(user_id, "user")
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=JWT_EXPIRY_HOURS * 3600
    )
    
    return {
        "message": "Signup successful",
        "user": {
            "id": user_id,
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": "user"
        }
    }

@api_router.post("/auth/login")
async def login(request: Request, data: LoginRequest, response: Response):
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
    
    # Find user by email or username
    user = await db.users.find_one({
        "$or": [
            {"email": data.identifier},
            {"username": data.identifier}
        ]
    }, {"_id": 0})
    
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    token = create_jwt_token(user["id"], user["role"], data.remember_me)
    
    max_age = JWT_EXTENDED_EXPIRY_DAYS * 24 * 3600 if data.remember_me else JWT_EXPIRY_HOURS * 3600
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=max_age
    )
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="auth_token")
    return {"message": "Logged out successfully"}

@api_router.post("/auth/forgot-password")
async def forgot_password(request: Request, data: PasswordResetRequest):
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset link has been sent"}
    
    # Create reset token
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    reset_record = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "token": reset_token,
        "expires_at": expires_at.isoformat(),
        "used_flag": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.password_resets.insert_one(reset_record)
    
    # Send email
    reset_link = f"/reset-password?token={reset_token}"
    await send_email(
        data.email,
        "Password Reset - Cricket Tournament Predictor League",
        f"Click this link to reset your password: {reset_link}\n\nThis link expires in 1 hour."
    )
    
    return {"message": "If the email exists, a reset link has been sent", "reset_token": reset_token}

@api_router.post("/auth/reset-password")
async def reset_password(data: PasswordResetConfirm):
    reset_record = await db.password_resets.find_one({
        "token": data.token,
        "used_flag": False
    }, {"_id": 0})
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    expires_at = datetime.fromisoformat(reset_record["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update password
    await db.users.update_one(
        {"id": reset_record["user_id"]},
        {"$set": {"password_hash": hash_password(data.password)}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"id": reset_record["id"]},
        {"$set": {"used_flag": True}}
    )
    
    return {"message": "Password reset successful"}

@api_router.get("/auth/me")
async def get_me(user: Dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"]
    }

@api_router.get("/auth/validate-invite/{token}")
async def validate_invite(token: str):
    nomination = await db.nominations.find_one({"invite_token": token}, {"_id": 0})
    if not nomination:
        raise HTTPException(status_code=400, detail="Invalid invite token")
    
    if nomination["status"] == "registered":
        raise HTTPException(status_code=400, detail="This invite has already been used")
    
    expires_at = datetime.fromisoformat(nomination["invite_expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Invite token has expired")
    
    return {
        "valid": True,
        "full_name": nomination["full_name"],
        "username": nomination["username"],
        "email": nomination["email"]
    }

# ==================== TOURNAMENT ROUTES ====================

@api_router.get("/tournaments")
async def get_tournaments():
    tournaments = await db.tournaments.find({}, {"_id": 0}).to_list(100)
    return tournaments

@api_router.get("/tournaments/active")
async def get_active_tournament():
    tournament = await db.tournaments.find_one({"active_flag": True}, {"_id": 0})
    return tournament

@admin_router.post("/tournaments")
async def create_tournament(data: TournamentCreate, user: Dict = Depends(get_admin_user)):
    tournament_id = str(uuid.uuid4())
    tournament = {
        "id": tournament_id,
        **data.model_dump(),
        "active_flag": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tournaments.insert_one(tournament)
    tournament.pop("_id", None)
    return tournament

@admin_router.put("/tournaments/{tournament_id}")
async def update_tournament(tournament_id: str, data: TournamentUpdate, user: Dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    # If setting as active, deactivate all other tournaments
    if update_data.get("active_flag") == True:
        await db.tournaments.update_many({}, {"$set": {"active_flag": False}})
    
    result = await db.tournaments.update_one(
        {"id": tournament_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    tournament = await db.tournaments.find_one({"id": tournament_id}, {"_id": 0})
    return tournament

@admin_router.delete("/tournaments/{tournament_id}")
async def delete_tournament(tournament_id: str, user: Dict = Depends(get_admin_user)):
    result = await db.tournaments.delete_one({"id": tournament_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Also delete related matches and predictions
    await db.matches.delete_many({"tournament_id": tournament_id})
    
    return {"message": "Tournament deleted successfully"}

# ==================== MATCH ROUTES ====================

@api_router.get("/matches")
async def get_matches(tournament_id: Optional[str] = None):
    query = {}
    if tournament_id:
        query["tournament_id"] = tournament_id
    matches = await db.matches.find(query, {"_id": 0}).sort("start_datetime_ist", 1).to_list(500)
    return matches

@api_router.get("/matches/{match_id}")
async def get_match(match_id: str):
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@admin_router.post("/matches")
async def create_match(data: MatchCreate, user: Dict = Depends(get_admin_user)):
    # Verify tournament exists
    tournament = await db.tournaments.find_one({"id": data.tournament_id})
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    match_id = str(uuid.uuid4())
    match = {
        "id": match_id,
        **data.model_dump(),
        "result_winner": None,
        "status": "upcoming",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.matches.insert_one(match)
    match.pop("_id", None)
    return match

@admin_router.put("/matches/{match_id}")
async def update_match(match_id: str, data: MatchUpdate, user: Dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    # If setting a result winner, mark as completed and update predictions
    if "result_winner" in update_data:
        update_data["status"] = "completed"
        
        # Update all predictions for this match
        match = await db.matches.find_one({"id": match_id}, {"_id": 0})
        if match:
            winner = update_data["result_winner"]
            await db.predictions.update_many(
                {"match_id": match_id},
                [{"$set": {"is_correct": {"$eq": ["$predicted_winner", winner]}}}]
            )
    
    result = await db.matches.update_one(
        {"id": match_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Match not found")
    
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    return match

@admin_router.delete("/matches/{match_id}")
async def delete_match(match_id: str, user: Dict = Depends(get_admin_user)):
    result = await db.matches.delete_one({"id": match_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Delete related predictions
    await db.predictions.delete_many({"match_id": match_id})
    
    return {"message": "Match deleted successfully"}

@admin_router.post("/matches/sync")
async def sync_matches(tournament_id: str, user: Dict = Depends(get_admin_user)):
    """Sync matches from CricAPI - fetches real cricket matches"""
    tournament = await db.tournaments.find_one({"id": tournament_id}, {"_id": 0})
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    teams = tournament.get("teams", [])
    tournament_teams_lower = [t.lower() for t in teams]
    
    if not CRICAPI_KEY:
        raise HTTPException(status_code=500, detail="CricAPI key not configured")
    
    matches_created = []
    match_no = await db.matches.count_documents({"tournament_id": tournament_id}) + 1
    
    try:
        async with httpx.AsyncClient() as client:
            # Fetch current matches from CricAPI
            response = await client.get(
                f"{CRICAPI_BASE_URL}/matches",
                params={"apikey": CRICAPI_KEY, "offset": 0},
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") != "success":
                raise HTTPException(status_code=500, detail=f"CricAPI error: {data.get('status')}")
            
            api_matches = data.get("data", [])
            logger.info(f"Fetched {len(api_matches)} matches from CricAPI")
            
            # Filter matches that involve tournament teams
            for api_match in api_matches:
                team1 = api_match.get("teamInfo", [{}])[0].get("name", api_match.get("teams", [""])[0]) if api_match.get("teamInfo") else api_match.get("teams", [""])[0]
                team2 = api_match.get("teamInfo", [{}])[1].get("name", api_match.get("teams", [""])[1]) if api_match.get("teamInfo") and len(api_match.get("teamInfo", [])) > 1 else api_match.get("teams", ["", ""])[1]
                
                # Check if match involves any of our tournament teams
                team1_lower = team1.lower() if team1 else ""
                team2_lower = team2.lower() if team2 else ""
                
                team1_match = any(t in team1_lower or team1_lower in t for t in tournament_teams_lower)
                team2_match = any(t in team2_lower or team2_lower in t for t in tournament_teams_lower)
                
                if team1_match or team2_match or len(teams) == 0:
                    # Check if match already exists
                    existing = await db.matches.find_one({
                        "tournament_id": tournament_id,
                        "cricapi_id": api_match.get("id")
                    })
                    
                    if not existing:
                        # Determine match status
                        match_status = "upcoming"
                        if api_match.get("matchStarted") and not api_match.get("matchEnded"):
                            match_status = "live"
                        elif api_match.get("matchEnded"):
                            match_status = "completed"
                        
                        # Parse date
                        match_date = api_match.get("dateTimeGMT") or api_match.get("date")
                        if match_date:
                            try:
                                if "T" in str(match_date):
                                    parsed_date = datetime.fromisoformat(match_date.replace("Z", "+00:00"))
                                else:
                                    parsed_date = datetime.strptime(match_date, "%Y-%m-%d")
                                    parsed_date = parsed_date.replace(tzinfo=timezone.utc)
                            except:
                                parsed_date = datetime.now(timezone.utc) + timedelta(days=1)
                        else:
                            parsed_date = datetime.now(timezone.utc) + timedelta(days=1)
                        
                        match = {
                            "id": str(uuid.uuid4()),
                            "cricapi_id": api_match.get("id"),
                            "tournament_id": tournament_id,
                            "match_no": match_no,
                            "stage": "Group",
                            "team_a": team1 or "Team A",
                            "team_b": team2 or "Team B",
                            "venue": api_match.get("venue", "TBD"),
                            "start_datetime_ist": parsed_date.isoformat(),
                            "result_winner": None,
                            "status": match_status,
                            "match_type": api_match.get("matchType", ""),
                            "series": api_match.get("name", ""),
                            "created_at": datetime.now(timezone.utc).isoformat()
                        }
                        await db.matches.insert_one(match)
                        matches_created.append(match)
                        match_no += 1
            
            return {
                "message": f"Synced {len(matches_created)} matches from CricAPI",
                "matches_count": len(matches_created),
                "total_api_matches": len(api_matches),
                "last_synced": datetime.now(timezone.utc).isoformat()
            }
            
    except httpx.HTTPError as e:
        logger.error(f"CricAPI HTTP error: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Failed to fetch from CricAPI: {str(e)}")
    except Exception as e:
        logger.error(f"CricAPI sync error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

# ==================== NOMINATION ROUTES ====================

@admin_router.get("/nominations")
async def get_nominations(user: Dict = Depends(get_admin_user)):
    nominations = await db.nominations.find({}, {"_id": 0}).to_list(1000)
    return nominations

@admin_router.post("/nominations")
async def create_nomination(data: NominationCreate, user: Dict = Depends(get_admin_user)):
    # Check if email or username already exists
    existing = await db.nominations.find_one({
        "$or": [
            {"email": data.email},
            {"username": data.username}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already nominated")
    
    nomination_id = str(uuid.uuid4())
    invite_token = secrets.token_urlsafe(32)
    invite_expires = datetime.now(timezone.utc) + timedelta(days=7)
    
    nomination = {
        "id": nomination_id,
        "full_name": data.full_name,
        "username": data.username,
        "email": data.email,
        "invite_token": invite_token,
        "invite_sent_at": datetime.now(timezone.utc).isoformat(),
        "invite_expires_at": invite_expires.isoformat(),
        "status": "invited",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.nominations.insert_one(nomination)
    
    # Send invite email
    active_tournament = await db.tournaments.find_one({"active_flag": True}, {"_id": 0})
    tournament_name = active_tournament["name"] if active_tournament else "Cricket Tournament Predictor League"
    
    invite_link = f"/signup?token={invite_token}"
    await send_email(
        data.email,
        f"You're Invited to {tournament_name}!",
        f"""Hi {data.full_name},

You have been invited to join {tournament_name}!

Click the link below to create your account and start predicting match winners:
{invite_link}

Your username will be: {data.username}

This invite expires in 7 days.

Good luck with your predictions!
"""
    )
    
    return {
        "id": nomination_id,
        "full_name": data.full_name,
        "username": data.username,
        "email": data.email,
        "invite_token": invite_token,
        "invite_sent_at": nomination["invite_sent_at"],
        "invite_expires_at": nomination["invite_expires_at"],
        "status": "invited",
        "created_at": nomination["created_at"]
    }

@admin_router.post("/nominations/bulk")
async def create_nominations_bulk(data: NominationBulkCreate, user: Dict = Depends(get_admin_user)):
    results = []
    for nom in data.nominations:
        try:
            result = await create_nomination(nom, user)
            results.append({"success": True, "nomination": result})
        except HTTPException as e:
            results.append({"success": False, "email": nom.email, "error": e.detail})
    return results

@admin_router.post("/nominations/{nomination_id}/resend-invite")
async def resend_invite(nomination_id: str, user: Dict = Depends(get_admin_user)):
    nomination = await db.nominations.find_one({"id": nomination_id}, {"_id": 0})
    if not nomination:
        raise HTTPException(status_code=404, detail="Nomination not found")
    
    if nomination["status"] == "registered":
        raise HTTPException(status_code=400, detail="User has already registered")
    
    # Generate new token
    invite_token = secrets.token_urlsafe(32)
    invite_expires = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.nominations.update_one(
        {"id": nomination_id},
        {"$set": {
            "invite_token": invite_token,
            "invite_sent_at": datetime.now(timezone.utc).isoformat(),
            "invite_expires_at": invite_expires.isoformat()
        }}
    )
    
    # Resend email
    active_tournament = await db.tournaments.find_one({"active_flag": True}, {"_id": 0})
    tournament_name = active_tournament["name"] if active_tournament else "Cricket Tournament Predictor League"
    
    invite_link = f"/signup?token={invite_token}"
    await send_email(
        nomination["email"],
        f"Reminder: You're Invited to {tournament_name}!",
        f"""Hi {nomination["full_name"]},

This is a reminder that you've been invited to join {tournament_name}!

Click the link below to create your account:
{invite_link}

This invite expires in 7 days.
"""
    )
    
    return {"message": "Invite resent successfully", "invite_token": invite_token}

# ==================== PREDICTION ROUTES ====================

@api_router.get("/predictions/my")
async def get_my_predictions(tournament_id: Optional[str] = None, user: Dict = Depends(get_current_user)):
    query = {"user_id": user["id"]}
    
    if tournament_id:
        # Get match IDs for this tournament
        matches = await db.matches.find({"tournament_id": tournament_id}, {"id": 1, "_id": 0}).to_list(500)
        match_ids = [m["id"] for m in matches]
        query["match_id"] = {"$in": match_ids}
    
    predictions = await db.predictions.find(query, {"_id": 0}).to_list(1000)
    return predictions

@api_router.post("/predictions")
async def submit_prediction(data: PredictionCreate, user: Dict = Depends(get_current_user)):
    # Get match details
    match = await db.matches.find_one({"id": data.match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Check cutoff
    match_start = datetime.fromisoformat(match["start_datetime_ist"].replace('Z', '')).replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    
    if now >= match_start:
        raise HTTPException(status_code=400, detail="Prediction cutoff has passed for this match")
    
    # Validate predicted winner
    if data.predicted_winner not in [match["team_a"], match["team_b"]]:
        raise HTTPException(status_code=400, detail="Invalid team selection")
    
    # Check if prediction already exists
    existing = await db.predictions.find_one({
        "user_id": user["id"],
        "match_id": data.match_id
    })
    
    if existing:
        # Update existing prediction
        await db.predictions.update_one(
            {"id": existing["id"]},
            {"$set": {
                "predicted_winner": data.predicted_winner,
                "last_edited_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        prediction = await db.predictions.find_one({"id": existing["id"]}, {"_id": 0})
    else:
        # Create new prediction
        prediction_id = str(uuid.uuid4())
        prediction = {
            "id": prediction_id,
            "user_id": user["id"],
            "match_id": data.match_id,
            "predicted_winner": data.predicted_winner,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "last_edited_at": datetime.now(timezone.utc).isoformat(),
            "is_correct": None
        }
        await db.predictions.insert_one(prediction)
        prediction.pop("_id", None)  # Remove MongoDB ObjectId if present
    
    return prediction

@api_router.get("/predictions/match/{match_id}")
async def get_match_predictions(match_id: str, user: Dict = Depends(get_current_user)):
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Only show all predictions for completed matches (unless admin)
    if match["status"] != "completed" and user["role"] != "admin":
        # Return only user's own prediction
        my_prediction = await db.predictions.find_one({
            "user_id": user["id"],
            "match_id": match_id
        }, {"_id": 0})
        return [my_prediction] if my_prediction else []
    
    # For completed matches, get all predictions with user info
    predictions = await db.predictions.find({"match_id": match_id}, {"_id": 0}).to_list(1000)
    
    # Enrich with user info
    result = []
    for pred in predictions:
        pred_user = await db.users.find_one({"id": pred["user_id"]}, {"_id": 0})
        if pred_user:
            result.append({
                **pred,
                "user_full_name": pred_user["full_name"],
                "user_username": pred_user["username"]
            })
    
    return result

# ==================== LEADERBOARD ROUTES ====================

@api_router.get("/leaderboard")
async def get_leaderboard(tournament_id: Optional[str] = None, stage_filter: Optional[str] = None):
    pipeline = []
    
    # If tournament specified, filter by tournament's matches
    if tournament_id:
        matches = await db.matches.find({"tournament_id": tournament_id}, {"id": 1, "stage": 1, "_id": 0}).to_list(500)
        match_ids = [m["id"] for m in matches]
        
        if stage_filter and stage_filter != "all":
            filtered_matches = [m["id"] for m in matches if m["stage"] == stage_filter]
            match_ids = filtered_matches
        
        pipeline.append({"$match": {"match_id": {"$in": match_ids}}})
    
    # Group by user
    pipeline.extend([
        {
            "$group": {
                "_id": "$user_id",
                "correct_predictions": {
                    "$sum": {"$cond": [{"$eq": ["$is_correct", True]}, 1, 0]}
                },
                "total_predictions": {"$sum": 1}
            }
        },
        {
            "$sort": {"correct_predictions": -1, "total_predictions": 1}
        }
    ])
    
    aggregated = await db.predictions.aggregate(pipeline).to_list(1000)
    
    # Enrich with user info
    leaderboard = []
    for idx, entry in enumerate(aggregated):
        user = await db.users.find_one({"id": entry["_id"]}, {"_id": 0})
        if user:
            accuracy = (entry["correct_predictions"] / entry["total_predictions"] * 100) if entry["total_predictions"] > 0 else 0
            leaderboard.append({
                "rank": idx + 1,
                "user_id": entry["_id"],
                "full_name": user["full_name"],
                "username": user["username"],
                "correct_predictions": entry["correct_predictions"],
                "total_predictions": entry["total_predictions"],
                "accuracy": round(accuracy, 2)
            })
    
    return leaderboard

# ==================== REPORT ROUTES ====================

@api_router.get("/report/{tournament_id}")
async def get_report(tournament_id: str, user: Dict = Depends(get_current_user)):
    tournament = await db.tournaments.find_one({"id": tournament_id}, {"_id": 0})
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Check if report is finalized or user is admin
    if not tournament.get("report_finalized") and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Report not yet published")
    
    # Get all matches for this tournament
    matches = await db.matches.find({"tournament_id": tournament_id}, {"_id": 0}).to_list(500)
    completed_matches = [m for m in matches if m["status"] == "completed"]
    
    # Get leaderboard
    leaderboard = await get_leaderboard(tournament_id)
    
    # Find winners (highest correct predictions)
    max_correct = max([e["correct_predictions"] for e in leaderboard]) if leaderboard else 0
    winners = [e for e in leaderboard if e["correct_predictions"] == max_correct]
    
    # Most predicted team
    predictions = await db.predictions.find({
        "match_id": {"$in": [m["id"] for m in matches]}
    }, {"_id": 0}).to_list(10000)
    
    team_counts = defaultdict(int)
    for pred in predictions:
        team_counts[pred["predicted_winner"]] += 1
    
    most_predicted_team = max(team_counts.items(), key=lambda x: x[1]) if team_counts else ("N/A", 0)
    
    # Toughest match (lowest prediction accuracy)
    match_accuracies = []
    for match in completed_matches:
        match_preds = [p for p in predictions if p["match_id"] == match["id"]]
        if match_preds:
            correct = sum(1 for p in match_preds if p["is_correct"])
            accuracy = (correct / len(match_preds)) * 100
            match_accuracies.append({
                "match": match,
                "accuracy": accuracy,
                "total_predictions": len(match_preds)
            })
    
    toughest_match = min(match_accuracies, key=lambda x: x["accuracy"]) if match_accuracies else None
    
    return {
        "tournament": tournament,
        "winners": winners,
        "leaderboard": leaderboard,
        "most_predicted_team": {"team": most_predicted_team[0], "count": most_predicted_team[1]},
        "toughest_match": toughest_match,
        "total_matches": len(matches),
        "completed_matches": len(completed_matches),
        "total_predictions": len(predictions),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

@admin_router.post("/report/{tournament_id}/finalize")
async def finalize_report(tournament_id: str, user: Dict = Depends(get_admin_user)):
    tournament = await db.tournaments.find_one({"id": tournament_id}, {"_id": 0})
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Mark as finalized
    await db.tournaments.update_one(
        {"id": tournament_id},
        {"$set": {
            "report_finalized": True,
            "report_finalized_at": datetime.now(timezone.utc).isoformat(),
            "status": "completed"
        }}
    )
    
    return {"message": "Report finalized and published"}

# ==================== ADMIN STATS ====================

@admin_router.get("/stats")
async def get_admin_stats(user: Dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({"role": "user"})
    total_nominations = await db.nominations.count_documents({})
    pending_invites = await db.nominations.count_documents({"status": "invited"})
    total_tournaments = await db.tournaments.count_documents({})
    active_tournament = await db.tournaments.find_one({"active_flag": True}, {"_id": 0})
    
    active_matches = 0
    total_predictions = 0
    if active_tournament:
        active_matches = await db.matches.count_documents({"tournament_id": active_tournament["id"]})
        matches = await db.matches.find({"tournament_id": active_tournament["id"]}, {"id": 1, "_id": 0}).to_list(500)
        match_ids = [m["id"] for m in matches]
        total_predictions = await db.predictions.count_documents({"match_id": {"$in": match_ids}})
    
    return {
        "total_users": total_users,
        "total_nominations": total_nominations,
        "pending_invites": pending_invites,
        "total_tournaments": total_tournaments,
        "active_tournament": active_tournament,
        "active_matches": active_matches,
        "total_predictions": total_predictions
    }

# ==================== STARTUP / SHUTDOWN ====================

@app.on_event("startup")
async def startup():
    # Seed admin user if not exists
    admin = await db.users.find_one({"role": "admin"})
    if not admin:
        admin_password = secrets.token_urlsafe(12)
        admin_user = {
            "id": str(uuid.uuid4()),
            "nomination_id": None,
            "username": "admin",
            "email": "admin@cricketpredictor.com",
            "full_name": "System Administrator",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info("="*50)
        logger.info("🏏 ADMIN USER CREATED")
        logger.info(f"   Username: admin")
        logger.info(f"   Email: admin@cricketpredictor.com")
        logger.info(f"   Password: {admin_password}")
        logger.info("="*50)
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.nominations.create_index("email", unique=True)
    await db.nominations.create_index("username", unique=True)
    await db.nominations.create_index("invite_token")
    await db.predictions.create_index([("user_id", 1), ("match_id", 1)], unique=True)
    await db.tournaments.create_index("active_flag")
    await db.matches.create_index("tournament_id")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Include routers
app.include_router(api_router)
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
