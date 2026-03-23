// server/services/emailService.js
import { envConfig } from '../config/env.config.js';
import nodemailer from 'nodemailer';

export const sendSupportTicketEmail = async (ticket) => {
  // 🛑 Skip if email not configured
  if (!envConfig.mail.user || !envConfig.mail.pass) {
    console.warn('📧 Email not configured — skipping support ticket notification');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // important for port 587
      auth: {
        user: envConfig.mail.user,
        pass: envConfig.mail.pass, // Use App Password for Gmail
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"ticketing issue" <${envConfig.mail.user}>`,
      to: 'support@cloudmasa.com',
      subject: `[New Ticket #${ticket.ticketId}] ${ticket.subject}`,
      // Optional plain-text fallback (recommended)
      text: `
New Support Ticket

Ticket ID: ${ticket.ticketId}
Subject: ${ticket.subject}
Category: ${ticket.category}
Priority: ${ticket.priority}
Requester: ${ticket.requester.name} (${ticket.username})

Description:
${ticket.description || 'No description provided.'}

View Ticket: ${envConfig.app.frontendURL}/sidebar/support/ticket/${ticket.ticketId}
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Support Ticket</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background-color: #F26A2E;
      padding: 16px 20px;
      color: white;
    }
    .header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
    }
    .content {
      padding: 20px;
    }
    .field {
      margin: 10px 0;
      line-height: 1.5;
    }
    .label {
      display: inline-block;
      min-width: 100px;
      font-weight: bold;
    }
    .priority {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 14px;
      background: ${
        ticket.priority === 'Critical' ? '#ffebee' :
        ticket.priority === 'High' ? '#ffe3e3' :
        ticket.priority === 'Medium' ? '#fff8e1' : '#e8f5e9'
      };
      color: ${
        ticket.priority === 'Critical' ? '#d32f2f' :
        ticket.priority === 'High' ? '#c62828' :
        ticket.priority === 'Medium' ? '#f57f17' : '#388e3c'
      };
    }
    .description-box {
      background: #f9f9f9;
      border-left: 4px solid #F26A2E;
      padding: 12px;
      margin: 16px 0;
      border-radius: 4px;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.4;
    }
    .btn {
      display: inline-block;
      background: #F26A2E;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 6px;
      margin-top: 16px;
      font-weight: bold;
      font-size: 14px;
    }
    hr {
      border: 0;
      border-top: 1px solid #eee;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h2>New Support Ticket</h2>
    </div>
    <div class="content">
      <div class="field"><span class="label">Ticket ID:</span> ${ticket.ticketId}</div>
      <div class="field"><span class="label">Subject:</span> ${ticket.subject}</div>
      <div class="field"><span class="label">Category:</span> ${ticket.category}</div>
      <div class="field"><span class="label">Priority:</span> <span class="priority">${ticket.priority}</span></div>
      <div class="field"><span class="label">Requester:</span> ${ticket.requester.name} (${ticket.username})</div>

      <hr>

      <div><strong>Description:</strong></div>
      <div class="description-box">${ticket.description || 'No description provided.'}</div>

      <a href="${envConfig.app.frontendURL}/sidebar/support/ticket/${ticket.ticketId}" class="btn">
        View Ticket in Dashboard
      </a>
    </div>
  </div>
</body>
</html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Support ticket email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send support ticket email:', error.message);
    throw error;
  }
};
