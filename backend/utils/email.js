const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // For development with Mailtrap or similar services
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
};

// Generate HTML email template for voting
const generateVotingEmailHTML = ({ pollTitle, pollDescription, token, magicLink, expiresAt }) => {
  const expiryTime = new Date(expiresAt).toLocaleString();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cast Your Vote</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background-color: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .poll-title {
                font-size: 20px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 15px;
                padding: 15px;
                background-color: #f3f4f6;
                border-radius: 8px;
                border-left: 4px solid #2563eb;
            }
            .poll-description {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 25px;
                line-height: 1.5;
            }
            .vote-button {
                display: inline-block;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                margin: 20px 0;
                transition: background-color 0.3s;
            }
            .vote-button:hover {
                background-color: #1d4ed8;
            }
            .token-section {
                background-color: #f8fafc;
                border: 1px dashed #cbd5e1;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                text-align: center;
            }
            .token-code {
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                color: #1e40af;
                background-color: white;
                padding: 10px 15px;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
                display: inline-block;
                margin: 10px 0;
                letter-spacing: 2px;
            }
            .expiry {
                color: #dc2626;
                font-weight: 600;
                font-size: 14px;
                margin-top: 20px;
                padding: 10px;
                background-color: #fef2f2;
                border-radius: 6px;
                border: 1px solid #fecaca;
            }
            .instructions {
                background-color: #eff6ff;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                border-left: 4px solid #3b82f6;
            }
            .instructions h3 {
                margin-top: 0;
                color: #1e40af;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #6b7280;
                text-align: center;
            }
            .security-note {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                font-size: 13px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🗳️ Polling System</div>
                <h1>You're Invited to Vote!</h1>
            </div>

            <div class="poll-title">${pollTitle}</div>

            ${pollDescription ? `<div class="poll-description">${pollDescription}</div>` : ''}

            <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" class="vote-button">
                    🎯 Cast Your Vote Now
                </a>
            </div>

            <div class="instructions">
                <h3>📋 How to Vote:</h3>
                <ol style="margin: 0; padding-left: 20px;">
                    <li>Click the "Cast Your Vote Now" button above</li>
                    <li>You'll be taken directly to the voting page</li>
                    <li>Select your preferred option</li>
                    <li>Submit your vote</li>
                </ol>
            </div>

            <div class="token-section">
                <h3>🔐 Your Voting Token</h3>
                <p>If the button doesn't work, you can manually enter this token:</p>
                <div class="token-code">${token}</div>
                <p style="font-size: 12px; color: #6b7280; margin-top: 15px;">
                    Visit: <a href="${frontendUrl}/vote">${frontendUrl}/vote</a>
                </p>
            </div>

            <div class="expiry">
                ⏰ This voting token expires on: <strong>${expiryTime}</strong>
            </div>

            <div class="security-note">
                <strong>🔒 Security Notice:</strong> This token is unique to you and can only be used once.
                Don't share this email or token with others.
            </div>

            <div class="footer">
                <p>This is an automated message from the Polling System.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>Need help? The voting token is valid until ${expiryTime}</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate plain text email template for voting
const generateVotingEmailText = ({ pollTitle, pollDescription, token, magicLink, expiresAt }) => {
  const expiryTime = new Date(expiresAt).toLocaleString();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  return `
🗳️ POLLING SYSTEM - CAST YOUR VOTE

You're invited to vote in: ${pollTitle}

${pollDescription ? `Description: ${pollDescription}\n` : ''}

🎯 VOTE NOW:
Click this link to cast your vote: ${magicLink}

🔐 YOUR VOTING TOKEN:
If the link doesn't work, use this token manually: ${token}
Visit: ${frontendUrl}/vote

📋 HOW TO VOTE:
1. Click the voting link above
2. You'll be taken directly to the voting page
3. Select your preferred option
4. Submit your vote

⏰ IMPORTANT: This token expires on ${expiryTime}

🔒 SECURITY: This token is unique and can only be used once. Don't share it with others.

---
This is an automated message from the Polling System.
If you didn't request this, please ignore this email.
  `.trim();
};

// Send voting email
const sendVotingEmail = async ({ email, poll, token, magicLink }) => {
  try {
    const transporter = createTransporter();

    const emailData = {
      pollTitle: poll.title,
      pollDescription: poll.description,
      token,
      magicLink,
      expiresAt: new Date(Date.now() + (parseInt(process.env.TOKEN_EXPIRY_HOURS || 24) * 60 * 60 * 1000))
    };

    const mailOptions = {
      from: {
        name: 'Polling System',
        address: process.env.EMAIL_FROM
      },
      to: email,
      subject: `🗳️ Cast your vote: ${poll.title}`,
      text: generateVotingEmailText(emailData),
      html: generateVotingEmailHTML(emailData),
      // Additional headers
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'X-Mailer': 'Polling System v1.0'
      }
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(`📧 Voting email sent to ${email} for poll: ${poll.title}`);
    console.log(`Message ID: ${result.messageId}`);

    return {
      success: true,
      messageId: result.messageId,
      email,
      pollTitle: poll.title
    };

  } catch (error) {
    console.error('❌ Failed to send voting email:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Send notification email (for admins or other notifications)
const sendNotificationEmail = async ({ to, subject, message, isHTML = false }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Polling System',
        address: process.env.EMAIL_FROM
      },
      to,
      subject,
      [isHTML ? 'html' : 'text']: message,
      headers: {
        'X-Mailer': 'Polling System v1.0'
      }
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(`📧 Notification email sent to ${to}`);

    return {
      success: true,
      messageId: result.messageId,
      to
    };

  } catch (error) {
    console.error('❌ Failed to send notification email:', error);
    throw new Error(`Notification email failed: ${error.message}`);
  }
};

// Test email configuration by sending a test email
const sendTestEmail = async (toEmail) => {
  try {
    const testMessage = `
      <h2>🎉 Email Configuration Test</h2>
      <p>This is a test email from the Polling System.</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
      <p>If you received this email, your email configuration is working correctly!</p>
      <hr>
      <small>This is an automated test message.</small>
    `;

    return await sendNotificationEmail({
      to: toEmail,
      subject: '✅ Polling System - Email Test',
      message: testMessage,
      isHTML: true
    });
  } catch (error) {
    throw new Error(`Test email failed: ${error.message}`);
  }
};

module.exports = {
  createTransporter,
  verifyEmailConfig,
  sendVotingEmail,
  sendNotificationEmail,
  sendTestEmail
};
