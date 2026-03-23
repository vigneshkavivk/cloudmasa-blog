
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Resend } = require("resend");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Callable Function: sendInvite
 * Description: Generates a token, saves to Firestore, and sends an HTML email via Resend.
 * Usage: const sendInvite = httpsCallable(functions, 'sendInvite');
 *        sendInvite({ email: 'user@example.com', role: 'support' });
 */
exports.sendInvite = functions.https.onCall(async (data, context) => {
  // Wrap everything in a top-level try/catch to ensure we control the error output
  try {
    // 1. Authentication & Role Check
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }

    const callerUid = context.auth.uid;
    
    // Verify Caller is Admin/Superadmin
    const callerSnap = await admin.firestore().collection("users").doc(callerUid).get();
    const callerData = callerSnap.data();

    if (!callerData || !["superadmin", "admin"].includes(callerData.role)) {
      throw new functions.https.HttpsError("permission-denied", "Unauthorized action.");
    }

    // 2. Input Validation
    const { email, role } = data;
    if (!email || !role) {
      throw new functions.https.HttpsError("invalid-argument", "Email and role are required.");
    }

    // 3. Check for Existing User
    const userQuery = await admin.firestore().collection("users").where("email", "==", email).get();
    if (!userQuery.empty) {
      throw new functions.https.HttpsError("already-exists", "User with this email already exists.");
    }

    // 4. Generate Token & Save to Firestore
    const inviteId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const inviteData = {
      token: inviteId,
      email: email,
      role: role,
      invitedBy: callerUid,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: Date.now(),
      used: false,
      status: 'pending'
    };

    try {
      await admin.firestore().collection("invites").doc(inviteId).set(inviteData);
    } catch (error) {
      console.error("Firestore write error:", error);
      throw new functions.https.HttpsError("unavailable", "Database unavailable. Please try again.");
    }

    // 5. Configure Resend
    const config = functions.config();
    const resendApiKey = (config.resend && config.resend.apikey) || process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.error("CRITICAL: Resend API Key is missing in functions config.");
      // Try to update status, ignore errors if this fails
      try {
        await admin.firestore().collection("invites").doc(inviteId).update({ status: 'config_error' });
      } catch (e) { /* ignore */ }
      
      throw new functions.https.HttpsError("failed-precondition", "System configuration error. Unable to send email.");
    }

    const resend = new Resend(resendApiKey);
    const inviteLink = `https://regibiz.web.app/#/register?token=${inviteId}`;

    // Professional HTML Template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e1e4e8; }
          .header { background-color: #0a192f; padding: 30px; text-align: center; }
          .header h1 { color: #f97316; margin: 0; font-size: 24px; letter-spacing: 1px; font-weight: 700; }
          .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
          .role-badge { background-color: #fff7ed; color: #c2410c; padding: 4px 12px; border-radius: 99px; font-weight: 600; font-size: 14px; border: 1px solid #ffedd5; display: inline-block; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); transition: transform 0.2s; }
          .btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4); }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .link-text { font-size: 12px; color: #94a3b8; margin-top: 24px; word-break: break-all; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RegiBIZ</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0; color: #0f172a;">You've been invited!</h2>
            <p>Hello,</p>
            <p>The RegiBIZ administration team has invited you to join the compliance platform.</p>
            <p>You have been assigned the role: <span class="role-badge">${role.toUpperCase()}</span></p>
            <p>Please accept this invitation to set up your secure account and access the dashboard.</p>
            
            <div class="btn-container">
              <a href="${inviteLink}" class="btn">Accept Invitation</a>
            </div>
            
            <div class="link-text">
              <p style="margin-bottom: 5px;">Or paste this link into your browser:</p>
              <a href="${inviteLink}" style="color: #f97316; text-decoration: none;">${inviteLink}</a>
            </div>
          </div>
          <div class="footer">
            <p>This invitation is valid for 7 days.<br>
            If you were not expecting this, please ignore this email.<br>
            &copy; ${new Date().getFullYear()} CloudMasa. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    let emailResponse;
    try {
      emailResponse = await resend.emails.send({
        from: "RegiBIZ Team <support@regibiz.web.app>",
        to: [email],
        subject: "You've been invited to join RegiBIZ",
        html: emailHtml,
      });
    } catch (apiError) {
      console.error("Resend SDK threw error:", apiError);
      throw new Error("Resend SDK Error: " + apiError.message);
    }

    const { data: emailData, error: emailError } = emailResponse;

    if (emailError) {
      // LOG RAW ERROR: Critical for debugging (e.g. domain verification)
      console.error("Resend API Returned Error:", JSON.stringify(emailError));
      
      // Update invite doc to failed
      try {
        await admin.firestore().collection("invites").doc(inviteId).update({ 
          status: 'email_failed',
          lastError: emailError.message || "Unknown API error"
        });
      } catch (e) { /* ignore */ }

      // Throw sanitized error for UI
      throw new functions.https.HttpsError(
        "failed-precondition", 
        `Email Service Error: ${emailError.message || 'Unable to send email'}`
      );
    }

    // Success: Update invite doc
    try {
      await admin.firestore().collection("invites").doc(inviteId).update({
        emailId: emailData ? emailData.id : 'unknown',
        status: 'sent'
      });
    } catch (e) {
      console.error("Failed to update invite status to sent:", e);
      // Don't fail the whole call if just the status update failed, as email was sent
    }

    return { success: true, inviteId };

  } catch (error) {
    // Top-level error handler
    console.error("Global SendInvite Error:", error);

    // If it's already a known HttpsError, re-throw it so the client gets the specific code
    if (error.code && error.details !== undefined) {
      throw error;
    }

    // Check if it's a specific Firebase HttpsError thrown via `new functions.https.HttpsError`
    if (error.httpErrorCode) {
        throw error;
    }

    // For any unknown/internal crashes, return a generic user-friendly error
    // using 'unknown' or 'aborted' code so the message shows up in UI
    throw new functions.https.HttpsError(
      "unknown", 
      "Unable to process invite request. Please try again or contact support."
    );
  }
});
