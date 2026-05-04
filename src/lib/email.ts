import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export async function sendTicketConfirmationEmail({
  toEmail,
  attendeeName,
  eventTitle,
  ticketQuantity,
  ticketId,
}: {
  toEmail: string;
  attendeeName: string;
  eventTitle: string;
  ticketQuantity: number;
  ticketId: string;
}) {
  if (!resend) {
    console.log("No Resend API key found, skipping email.");
    return;
  }

  const appUrl = env.appUrl || "http://localhost:3000";
  const ticketUrl = `${appUrl}/tickets/${ticketId}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
      <h1 style="color: #d1410c; margin-top: 0;">You're going to ${eventTitle}! 🎉</h1>
      <p style="font-size: 16px; color: #333; line-height: 1.5;">Hi ${attendeeName},</p>
      <p style="font-size: 16px; color: #333; line-height: 1.5;">
        Your booking is confirmed. You have successfully claimed <strong>${ticketQuantity} ticket${ticketQuantity > 1 ? 's' : ''}</strong> for <strong>${eventTitle}</strong>.
      </p>
      
      <div style="margin: 40px 0; text-align: center;">
        <a href="${ticketUrl}" style="background-color: #d1410c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
          View Digital Pass & QR Code
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Or copy and paste this link into your browser: <br/>
        <a href="${ticketUrl}" style="color: #d1410c; word-break: break-all;">${ticketUrl}</a>
      </p>
      
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 40px 0 20px;" />
      
      <p style="margin: 0; color: #888; font-size: 12px; text-align: center;">
        Powered by <strong>Evently</strong>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: `Evently <${fromEmail}>`,
      to: toEmail,
      subject: `Your Tickets for ${eventTitle}`,
      html,
    });
    console.log("Successfully sent ticket confirmation email to", toEmail);
  } catch (err) {
    console.error("Failed to send ticket email:", err);
  }
}
