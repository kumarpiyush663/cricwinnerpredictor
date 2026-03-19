# Cricket Tournament Predictor League - PRD

## Original Problem Statement
Build a complete, production-ready web application called "Cricket Tournament Predictor League" with:
- Tournament & Schedule Management (Admin)
- User Nomination System with invite emails
- JWT-based Authentication (signup via invite, login, password reset)
- Match Prediction System with cutoff rules
- Live Leaderboard with filters
- End-of-Tournament Report with PDF export

## User Personas

### Admin
- Creates and manages tournaments
- Manages match schedules (manual entry or mock API sync)
- Nominates users and sends invite emails
- Enters match results
- Finalizes tournaments and publishes reports

### Regular User
- Receives invite email and signs up
- Predicts match winners before cutoff
- Views leaderboard and own predictions
- Views tournament reports after finalization

## Architecture

### Tech Stack
- **Frontend**: React 19 with React Router, Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python) with Motor (async MongoDB driver)
- **Database**: MongoDB
- **Authentication**: JWT tokens (httpOnly cookies + localStorage fallback)
- **Email**: Mocked (logs to console)
- **Cricket API**: Mocked (generates sample matches)

### Database Collections
- `tournaments` - Tournament details with teams, dates, status
- `matches` - Match schedules with teams, venue, datetime
- `nominations` - User invitations with tokens
- `users` - Registered users with hashed passwords
- `predictions` - User match predictions
- `password_resets` - Password reset tokens

## Core Requirements (Static)

### Section 1: Tournament Management
- [x] Admin can create multiple tournaments (T20/ODI/Test)
- [x] Admin can set one tournament as active
- [x] Tournament selector in navbar

### Section 2: Schedule Management
- [x] Manual match entry (all fields)
- [x] Mock API sync (generates sample matches)
- [x] Match edit/delete functionality

### Section 3: User Nomination
- [x] Admin adds users with name, username, email
- [x] Auto-generate invite token (expires in 7 days)
- [x] Mock email sent to console
- [x] Resend invite functionality

### Section 4: Authentication
- [x] Signup via invite link only
- [x] Login with email/username + password
- [x] JWT stored in httpOnly cookie
- [x] Remember me (7-day expiry)
- [x] Password reset flow
- [x] Admin pre-seeded on startup

### Section 5: Prediction System
- [x] Cutoff = match start time
- [x] Users can predict before cutoff
- [x] Can change prediction before cutoff
- [x] Locked after cutoff
- [x] Admin enters match results
- [x] Auto-calculate correct predictions

### Section 6: Leaderboard
- [x] Live rankings with stats
- [x] Filter by stage (Group/QF/SF/Final)
- [x] Highlight current user
- [x] Top 3 podium display

### Section 7: Report
- [x] Tournament winners
- [x] Statistics (most predicted team, toughest match)
- [x] Full leaderboard
- [x] PDF export functionality

## What's Been Implemented ✅

### Date: March 19, 2026

**Backend (FastAPI)**
- Complete authentication system (signup, login, logout, password reset)
- Tournament CRUD with active flag management
- Match management with manual/auto modes
- User nomination with mocked email
- Prediction system with cutoff validation
- Leaderboard aggregation with filters
- Report generation with statistics
- Admin stats endpoint
- Rate limiting for auth endpoints

**Frontend (React)**
- Landing page with hero section
- Login/Signup/Password Reset pages
- Dashboard with match cards
- Match prediction with inline selection
- Leaderboard with podium display
- Tournament Report with PDF export
- Admin Panel with tabs:
  - Overview (active tournament, pending invites)
  - Tournaments (create/edit/delete)
  - Matches (manual entry + sync)
  - Nominations (add users, resend invites)
- Dark/Light theme toggle
- Mobile responsive design
- Toast notifications

## Mocked Features (To Replace in Production)
1. **Email sending** - Currently logs to console
2. **Cricket API sync** - Generates sample matches

## Prioritized Backlog

### P0 (Critical) - Done ✅
- Authentication system
- Tournament management
- Match management
- Prediction system
- Leaderboard

### P1 (Important)
- Real email integration (SendGrid/Resend)
- Real cricket API integration
- User profile page
- Password change for logged-in users

### P2 (Nice to Have)
- CSV upload for bulk nominations
- Match reschedule notifications
- Real-time leaderboard updates (WebSockets)
- Individual user scorecards in report
- More detailed prediction analytics

## Next Tasks
1. Integrate real email service (SendGrid/Resend)
2. Integrate real cricket API (RapidAPI Cricbuzz)
3. Add user profile page with settings
4. Implement CSV bulk upload for nominations
5. Add match reschedule email notifications
