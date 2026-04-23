import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL || "noreply@synswipe.app";
const appUrl = process.env.APP_URL || "https://synswipe.app";

const resend = apiKey && apiKey.startsWith("re_") ? new Resend(apiKey) : null;

function logEmail(subject: string, to: string, body: string) {
  console.log(`\n[EMAIL - ${resend ? "LIVE" : "CONSOLE ONLY"}] ${subject}`);
  console.log(`  To: ${to}`);
  console.log(`  Body: ${body.substring(0, 150)}...\n`);
}

// ─── Welcome Email ───
export async function sendWelcomeEmail(to: string, username: string) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f0f0f;color:#fff;border-radius:12px;">
      <h1 style="color:#F04F51;font-size:24px;margin-bottom:8px;">Welcome to SynSwipe!</h1>
      <p style="color:#AFAFAF;font-size:14px;line-height:1.6;">
        Hey <strong style="color:#fff;">${username}</strong>, your account is ready.
      </p>
      <p style="color:#AFAFAF;font-size:14px;line-height:1.6;">
        Discover amazing AI avatars, rate your favorites with fire or ice, and connect with creators.
      </p>
      <a href="${appUrl}/discover" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#F04F51;color:#fff;text-decoration:none;border-radius:24px;font-weight:bold;">
        Start Exploring
      </a>
      <p style="color:#666;font-size:11px;margin-top:24px;">
        If you didn't create this account, you can safely ignore this email.
      </p>
    </div>
  `;

  const text = `Welcome to SynSwipe, ${username}! Your account is ready. Start exploring at ${appUrl}/discover`;

  if (resend) {
    await resend.emails.send({
      from: `SynSwipe <${fromEmail}>`,
      to,
      subject: "Welcome to SynSwipe!",
      html,
      text,
    });
  }
  logEmail("Welcome Email", to, text);
}

// ─── Email Verification ───
export async function sendVerificationEmail(to: string, username: string, code: string) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f0f0f;color:#fff;border-radius:12px;">
      <h1 style="color:#F04F51;font-size:24px;margin-bottom:8px;">Verify Your Email</h1>
      <p style="color:#AFAFAF;font-size:14px;line-height:1.6;">
        Hey <strong style="color:#fff;">${username}</strong>, use the code below to verify your email address.
      </p>
      <div style="margin:24px 0;padding:16px;background:#1a1a1a;border-radius:12px;text-align:center;letter-spacing:0.5em;font-size:28px;font-weight:bold;color:#fff;">
        ${code}
      </div>
      <p style="color:#AFAFAF;font-size:13px;">This code expires in 24 hours.</p>
      <p style="color:#666;font-size:11px;margin-top:24px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  const text = `Hey ${username}, your SynSwipe verification code is: ${code}. This code expires in 24 hours.`;

  if (resend) {
    await resend.emails.send({
      from: `SynSwipe <${fromEmail}>`,
      to,
      subject: "Your SynSwipe Verification Code",
      html,
      text,
    });
  }
  logEmail("Verification Code", to, text);
}

// ─── Password Reset ───
export async function sendPasswordResetEmail(to: string, username: string, token: string) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f0f0f;color:#fff;border-radius:12px;">
      <h1 style="color:#F04F51;font-size:24px;margin-bottom:8px;">Password Reset</h1>
      <p style="color:#AFAFAF;font-size:14px;line-height:1.6;">
        Hey <strong style="color:#fff;">${username}</strong>, we received a request to reset your password.
      </p>
      <div style="margin:24px 0;padding:16px;background:#1a1a1a;border-radius:12px;text-align:center;letter-spacing:0.3em;font-size:24px;font-weight:bold;color:#fff;">
        ${token}
      </div>
      <p style="color:#AFAFAF;font-size:13px;">Enter this code in the app to set a new password. This code expires in 1 hour.</p>
      <p style="color:#666;font-size:11px;margin-top:24px;">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>
  `;

  const text = `Hey ${username}, your SynSwipe password reset code is: ${token}. This code expires in 1 hour. If you didn't request this, ignore this email.`;

  if (resend) {
    await resend.emails.send({
      from: `SynSwipe <${fromEmail}>`,
      to,
      subject: "SynSwipe Password Reset",
      html,
      text,
    });
  }
  logEmail("Password Reset", to, text);
}

export function emailConfigured(): boolean {
  return resend !== null;
}
