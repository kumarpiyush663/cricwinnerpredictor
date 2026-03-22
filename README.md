# 🏏 Cricket Predictor League

A complete, modern web platform that allows users to test their cricket knowledge by predicting match winners during active cricket tournaments. Admins have a powerful suite of tools to manage tournaments, edit matches, review analytics, and approve users.

![Cricket Predictor](https://img.shields.io/badge/Status-Active-success) ![React](https://img.shields.io/badge/React-18-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.104-teal) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

---

## ✨ Features

### For Users
*   🎯 **Predict Match Winners:** Interactively select the team you think will win upcoming matches.
*   🏆 **Leaderboard:** Track your ranking points across the tournament compared to other players.
*   📈 **Match Reports:** After the tournament, view a detailed report breakdown of everyone's predictions.
*   🌓 **Dark Mode:** A beautifully designed interface with full dark mode support.
*   ✉️ **Account Requests:** Easily request an invite to the platform. 

### For Admins
*   🛠️ **Tournament Management:** Create, edit, and toggle active tournaments.
*   📅 **Match Data Sync:** Automatically pull tournament fixtures from CricAPI or upload them via a custom CSV file.
*   👥 **User Management:** Review all account requests, approve users, resend invites, and delete abusers.
*   📊 **Analytics:** Live dashboard showing active participants, total predictions, and match progress.

---

## 🚀 Interactive Quick Start Guide

### 1. Requirements
*   Node.js (v16+)
*   Python 3.9+
*   MongoDB Atlas Account
*   Brevo Account (for transactional emails)
*   CricAPI Account (for fetching match fixtures automatically)

### 2. Backend Setup
1.  Navigate into the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Set up your `.env` variables (use the included template):
    *   `MONGODB_URI`: Your MongoDB Atlas connection string.
    *   `JWT_SECRET`: A secure random string for tokens.
    *   `FRONTEND_URL`: URL of your frontend (e.g., `http://localhost:3000`).
    *   `BREVO_API_KEY`: Brevo email service key.
    *   `CRICAPI_KEY`: API Key for CricAPI.
4.  Run the backend server:
    ```bash
    uvicorn server:app --reload
    ```
    The server will be available at: **http://localhost:8000**

### 3. Frontend Setup
1.  Navigate into the `frontend/` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  Set up your `.env` variables:
    *   `REACT_APP_BACKEND_URL`: The URL where the FastAPI backend is running (e.g., `http://localhost:8000`).
4.  Run the frontend developer server:
    ```bash
    npm start
    ```
    The web app will be available at: **http://localhost:3000**

---

## 📘 User Guide

Welcome to the **Cricket Predictor League**!

1.  **Gaining Access:** Visit the main page and click **Request an invite**. Fill in your Name, Username, and Email. The Admin will review your specific request.
2.  **Activating your Account:** Once approved, you will receive an email with a secure registration link. Click it, create a strong password, and log in.
3.  **Making Predictions:** On the **Dashboard**, you will see all active matches. Click the team you think will win to log your prediction. You can edit your choice at any point until the match starts!
4.  **Checking Results:** Once a match concludes, the Admin will update the final result. Your prediction will turn Green (correct) or Red (incorrect).
5.  **Viewing the Leaderboard:** Click **Leaderboard** in the top navigation to see who has the most accurate predictions!

---

## 📕 Admin Guide

The Admin experience is centralized in the powerful **Admin Panel**.

### Accessing the Dashboard
Log in to your admin account. You will notice an exclusive **Admin** button in the navigation bar. Click it to enter the dashboard.

### 1. Tournaments Tab
*   Here, you can create a completely new tournament (e.g., *IPL 2025*).
*   Use the **Edit** and **Set Active** toggles to control which tournament users see.

### 2. Matches Tab
*   **Sync Matches:** Enter the exact Tournament Name from CricAPI and click "Sync from CricAPI" to automatically populate fixtures.
*   **Bulk Upload:** Need a custom set of matches? Click "Bulk Upload CSV". Ensure your CSV contains: `Match No`, `Date`, `Time`, `Team 1`, `Team 2`, `Venue`, `Match Type`. The system will automatically adapt your dates/times.
*   **Set Result:** When a match is over, click "Set Result" and pick the winner. Points are automatically distributed to the relevant users!

### 3. Nominations Tab
*   **Account Approvals:** Anyone who requests an account shows up here under the blue **Requested** badge. Click the Green Checkmark to auto-generate an invite link and email, or the Red Trash icon to reject them.
*   **User Management:** You can delete both specific *invites* or entirely *registered users* to permanently remove them from the league's database and leaderboard.

### 4. Overview Tab
*   **Finalize Report:** When the tournament finishes, you can click "Finalize Tournament". This freezes predictions and publicly publishes a comprehensive accuracy report (accessible from the *Reports* tab for everyday users).

---

## 🔧 Technologies Used
*   **Frontend:** React, React Router, TailwindCSS, shadcn/ui, PapaParse (CSV)
*   **Backend:** Python, FastAPI, Motor (Async MongoDB), Pydantic
*   **Database:** MongoDB Atlas
*   **Emailing:** Brevo SMTP

---

## 📜 License
This project is proprietary and built for personal league management. All rights reserved.
