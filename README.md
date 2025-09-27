# Polling System with Results Dashboard

**📌 Project Description**

Web-Wizards2025 is a secure online polling system designed for educational institutions. The platform allows administrators to create polls, and students to cast votes only once per poll. The system features a real-time results dashboard with charts and graphs to visualize voting outcomes dynamically. It ensures integrity by preventing duplicate or invalid votes, making it a reliable tool for polls, surveys, and feedback collection.

**Key Features**

 - Admins can create and manage polls with multiple options.

 - Students can vote once per poll.

 - Dynamic live results displayed with charts/graphs.

 - Protection against duplicate and invalid votes.

**⚙️ Setup Instructions**

Follow these steps to run the project locally:

1. Clone the repository
git clone https://github.com/nandit27/Web-Wizards2025.git
cd Web-Wizards2025

2. Install dependencies

Ensure you have Node.js
 installed, then run:

npm install

3. Configure Environment Variables

**Create a .env file in the root directory and add the following configurations:
**
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/polling-system
ADMIN_SECRET=admin
EMAIL_HOST=your_email_host
EMAIL_PORT=your_email_port
EMAIL_USER=your_email
EMAIL_PASS=your_email_password

4. Run the development server
npm run dev


The application should now be running at http://localhost:3001
.

**👥 Team Details**

Nandit Kalaria

Mahi Patel

Kavya Patel

Dhruvi Patel

