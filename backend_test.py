#!/usr/bin/env python3
"""
Cricket Tournament Predictor League - Backend API Testing
Tests all backend API endpoints and functionality.
"""

import requests
import sys
import uuid
from datetime import datetime, timedelta
import json

class CricketAPITester:
    def __init__(self, base_url="https://cricket-league-34.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.tournament_id = None
        self.match_id = None
        self.nomination_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, passed, error_msg="", expected_status=None, actual_status=None):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {error_msg}")
            if expected_status and actual_status:
                print(f"   Expected: {expected_status}, Got: {actual_status}")
        
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "error": error_msg if not passed else None
        })

    def make_request(self, method, endpoint, expected_status=200, data=None, headers=None, use_admin_auth=False, use_user_auth=False):
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        
        # Setup headers
        request_headers = {'Content-Type': 'application/json'}
        if headers:
            request_headers.update(headers)
        
        # Add auth token if specified
        if use_admin_auth and self.admin_token:
            request_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif use_user_auth and self.user_token:
            request_headers['Authorization'] = f'Bearer {self.user_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=request_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=request_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=request_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=request_headers)
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {}
                
            return success, response.status_code, response_data

        except Exception as e:
            return False, 0, {"error": str(e)}

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        print("\n🔐 Testing Admin Authentication...")
        
        success, status, data = self.make_request(
            'POST', 
            'auth/login', 
            expected_status=200,
            data={"identifier": "admin", "password": "t3Wnr_Y5pOlfMRdU", "remember_me": False}
        )
        
        if success and 'token' in data:
            self.admin_token = data['token']
            self.log_result("Admin login", True)
            return True
        else:
            self.log_result("Admin login", False, f"Status: {status}, Response: {data}")
            return False

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test auth/me with admin token
        success, status, data = self.make_request('GET', 'auth/me', expected_status=200, use_admin_auth=True)
        self.log_result("Get admin profile", success, f"Status: {status}" if not success else "")

        # Test password reset request
        success, status, data = self.make_request(
            'POST', 
            'auth/forgot-password', 
            expected_status=200,
            data={"email": "admin@cricketpredictor.com"}
        )
        self.log_result("Password reset request", success, f"Status: {status}" if not success else "")

    def test_tournament_endpoints(self):
        """Test tournament management"""
        print("\n🏆 Testing Tournament Endpoints...")
        
        # Get all tournaments
        success, status, data = self.make_request('GET', 'tournaments', expected_status=200)
        self.log_result("Get tournaments", success, f"Status: {status}" if not success else "")

        # Get active tournament
        success, status, data = self.make_request('GET', 'tournaments/active', expected_status=200)
        self.log_result("Get active tournament", success, f"Status: {status}" if not success else "")

        # Create new tournament (admin only)
        tournament_data = {
            "name": f"Test Tournament {datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "format": "T20",
            "year": 2024,
            "start_date": "2024-12-01T00:00:00Z",
            "end_date": "2024-12-31T23:59:59Z",
            "teams": ["Team A", "Team B", "Team C", "Team D"],
            "status": "upcoming"
        }
        
        success, status, data = self.make_request(
            'POST', 
            'admin/tournaments', 
            expected_status=200,
            data=tournament_data,
            use_admin_auth=True
        )
        
        if success and 'id' in data:
            self.tournament_id = data['id']
            self.log_result("Create tournament", True)
            
            # Update tournament to set as active
            success, status, data = self.make_request(
                'PUT',
                f'admin/tournaments/{self.tournament_id}',
                expected_status=200,
                data={"active_flag": True},
                use_admin_auth=True
            )
            self.log_result("Set tournament active", success, f"Status: {status}" if not success else "")
            
        else:
            self.log_result("Create tournament", False, f"Status: {status}, Response: {data}")

    def test_match_endpoints(self):
        """Test match management"""
        if not self.tournament_id:
            print("\n⚠️ Skipping match tests - no tournament created")
            return
            
        print("\n🏏 Testing Match Endpoints...")
        
        # Get matches for tournament
        success, status, data = self.make_request('GET', f'matches?tournament_id={self.tournament_id}', expected_status=200)
        self.log_result("Get matches", success, f"Status: {status}" if not success else "")

        # Create a match
        match_data = {
            "tournament_id": self.tournament_id,
            "match_no": 1,
            "stage": "Group",
            "team_a": "Team A",
            "team_b": "Team B",
            "venue": "Test Stadium, Test City",
            "start_datetime_ist": (datetime.now() + timedelta(days=1)).isoformat()
        }
        
        success, status, data = self.make_request(
            'POST',
            'admin/matches',
            expected_status=200,
            data=match_data,
            use_admin_auth=True
        )
        
        if success and 'id' in data:
            self.match_id = data['id']
            self.log_result("Create match", True)
            
            # Get specific match
            success, status, data = self.make_request('GET', f'matches/{self.match_id}', expected_status=200)
            self.log_result("Get specific match", success, f"Status: {status}" if not success else "")
            
        else:
            self.log_result("Create match", False, f"Status: {status}, Response: {data}")

        # Test match sync (mock API)
        success, status, data = self.make_request(
            'POST',
            f'admin/matches/sync?tournament_id={self.tournament_id}',
            expected_status=200,
            use_admin_auth=True
        )
        self.log_result("Sync matches (mock API)", success, f"Status: {status}" if not success else "")

    def test_nomination_endpoints(self):
        """Test user nomination system"""
        print("\n👥 Testing Nomination Endpoints...")
        
        # Get all nominations
        success, status, data = self.make_request('GET', 'admin/nominations', expected_status=200, use_admin_auth=True)
        self.log_result("Get nominations", success, f"Status: {status}" if not success else "")

        # Create a nomination
        nomination_data = {
            "full_name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        }
        
        success, status, data = self.make_request(
            'POST',
            'admin/nominations',
            expected_status=200,
            data=nomination_data,
            use_admin_auth=True
        )
        
        if success and 'id' in data:
            self.nomination_id = data['id']
            invite_token = data.get('invite_token')
            self.log_result("Create nomination", True)
            
            # Test invite validation
            if invite_token:
                success, status, data = self.make_request('GET', f'auth/validate-invite/{invite_token}', expected_status=200)
                self.log_result("Validate invite token", success, f"Status: {status}" if not success else "")
            
        else:
            self.log_result("Create nomination", False, f"Status: {status}, Response: {data}")

    def test_prediction_endpoints(self):
        """Test prediction functionality"""
        if not self.match_id:
            print("\n⚠️ Skipping prediction tests - no match created")
            return
            
        print("\n🎯 Testing Prediction Endpoints...")
        
        # Get my predictions (should be empty initially)
        success, status, data = self.make_request('GET', 'predictions/my', expected_status=200, use_admin_auth=True)
        self.log_result("Get my predictions", success, f"Status: {status}" if not success else "")

        # Submit a prediction
        prediction_data = {
            "match_id": self.match_id,
            "predicted_winner": "Team A"
        }
        
        success, status, data = self.make_request(
            'POST',
            'predictions',
            expected_status=200,
            data=prediction_data,
            use_admin_auth=True
        )
        self.log_result("Submit prediction", success, f"Status: {status}" if not success else "")

        # Get match predictions
        success, status, data = self.make_request('GET', f'predictions/match/{self.match_id}', expected_status=200, use_admin_auth=True)
        self.log_result("Get match predictions", success, f"Status: {status}" if not success else "")

    def test_leaderboard_endpoints(self):
        """Test leaderboard functionality"""
        if not self.tournament_id:
            print("\n⚠️ Skipping leaderboard tests - no tournament created")
            return
            
        print("\n🏆 Testing Leaderboard Endpoints...")
        
        # Get leaderboard for tournament
        success, status, data = self.make_request('GET', f'leaderboard?tournament_id={self.tournament_id}', expected_status=200)
        self.log_result("Get tournament leaderboard", success, f"Status: {status}" if not success else "")

        # Get leaderboard with stage filter
        success, status, data = self.make_request('GET', f'leaderboard?tournament_id={self.tournament_id}&stage_filter=Group', expected_status=200)
        self.log_result("Get filtered leaderboard", success, f"Status: {status}" if not success else "")

    def test_report_endpoints(self):
        """Test report functionality"""
        if not self.tournament_id:
            print("\n⚠️ Skipping report tests - no tournament created")
            return
            
        print("\n📊 Testing Report Endpoints...")
        
        # Try to get report (should fail as not finalized)
        success, status, data = self.make_request('GET', f'report/{self.tournament_id}', expected_status=403, use_admin_auth=True)
        self.log_result("Get unfinalized report (should fail)", success, f"Expected 403, got {status}" if not success else "")

        # Finalize report
        success, status, data = self.make_request(
            'POST',
            f'admin/report/{self.tournament_id}/finalize',
            expected_status=200,
            use_admin_auth=True
        )
        self.log_result("Finalize tournament report", success, f"Status: {status}" if not success else "")

        # Now get the report
        success, status, data = self.make_request('GET', f'report/{self.tournament_id}', expected_status=200, use_admin_auth=True)
        self.log_result("Get finalized report", success, f"Status: {status}" if not success else "")

    def test_admin_stats(self):
        """Test admin statistics"""
        print("\n📈 Testing Admin Stats...")
        
        success, status, data = self.make_request('GET', 'admin/stats', expected_status=200, use_admin_auth=True)
        
        if success:
            print(f"   📊 Stats: {data}")
            self.log_result("Get admin stats", True)
        else:
            self.log_result("Get admin stats", False, f"Status: {status}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🏏 Cricket Tournament Predictor League - API Testing")
        print("=" * 60)
        
        # Test admin login first - this is critical
        if not self.test_admin_login():
            print("\n❌ CRITICAL: Admin login failed. Cannot proceed with admin-only tests.")
            print("Please verify admin credentials: admin / t3Wnr_Y5pOlfMRdU")
        
        # Run all test suites
        self.test_auth_endpoints()
        self.test_tournament_endpoints()
        self.test_match_endpoints()
        self.test_nomination_endpoints()
        self.test_prediction_endpoints()
        self.test_leaderboard_endpoints()
        self.test_report_endpoints()
        self.test_admin_stats()
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed ({(self.tests_passed/self.tests_run*100):.1f}%)")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['passed']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = CricketAPITester()
    
    print("🔍 Testing Cricket Tournament Predictor League Backend API...")
    print(f"🌐 Base URL: {tester.base_url}")
    
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ All tests passed! Backend API is working correctly.")
        return 0
    else:
        print(f"\n❌ Some tests failed. Backend needs attention.")
        return 1

if __name__ == "__main__":
    sys.exit(main())