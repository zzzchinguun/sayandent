import { Resend } from 'resend';

/**
 * Resend email helpers.
 *
 * Required env vars:
 *   RESEND_API_KEY    — from resend.com/api-keys
 *   RESEND_FROM_EMAIL — verified sender (use onboarding@resend.dev for testing)
 *   RESEND_TO_EMAIL   — clinic inbox that receives notifications
 */

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const toEmail = process.env.RESEND_TO_EMAIL;

const resend = apiKey ? new Resend(apiKey) : null;

type SendArgs = {
  subject: string;
  html: string;
  replyTo?: string;
};

/**
 * Send a notification email to the clinic inbox. Failures are logged but
 * never thrown — email is best-effort and must not block form submission.
 */
export async function sendClinicNotification({ subject, html, replyTo }: SendArgs) {
  if (!resend || !toEmail) {
    console.warn('[email] Resend not configured — skipping send');
    return { skipped: true };
  }

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    if (result.error) {
      console.error('[email] Resend error:', result.error);
      return { error: result.error };
    }
    return { id: result.data?.id };
  } catch (err) {
    console.error('[email] sendClinicNotification threw:', err);
    return { error: err };
  }
}

export function contactEmailHTML(input: {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
}) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="margin:0 0 16px;color:#852464">New contact form submission</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#666;width:120px">Name</td><td style="padding:8px 0"><strong>${escapeHtml(input.name)}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0">${escapeHtml(input.email)}</td></tr>
        ${input.phone ? `<tr><td style="padding:8px 0;color:#666">Phone</td><td style="padding:8px 0">${escapeHtml(input.phone)}</td></tr>` : ''}
      </table>
      <h3 style="margin:24px 0 8px;color:#666;font-size:14px;text-transform:uppercase;letter-spacing:0.1em">Message</h3>
      <div style="padding:16px;background:#f7f7f7;border-radius:8px;white-space:pre-wrap">${escapeHtml(input.message)}</div>
    </div>
  `;
}

export function appointmentEmailHTML(input: {
  fullName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  serviceType: string;
  notes?: string | null;
}) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="margin:0 0 16px;color:#852464">New appointment request</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#666;width:140px">Patient</td><td style="padding:8px 0"><strong>${escapeHtml(input.fullName)}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">Phone</td><td style="padding:8px 0">${escapeHtml(input.phone)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0">${escapeHtml(input.email)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Preferred date</td><td style="padding:8px 0">${escapeHtml(input.preferredDate)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Preferred time</td><td style="padding:8px 0">${escapeHtml(input.preferredTime)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Service</td><td style="padding:8px 0">${escapeHtml(input.serviceType)}</td></tr>
      </table>
      ${
        input.notes
          ? `<h3 style="margin:24px 0 8px;color:#666;font-size:14px;text-transform:uppercase;letter-spacing:0.1em">Notes</h3>
             <div style="padding:16px;background:#f7f7f7;border-radius:8px;white-space:pre-wrap">${escapeHtml(input.notes)}</div>`
          : ''
      }
    </div>
  `;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
