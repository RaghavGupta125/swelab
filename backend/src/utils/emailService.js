import nodemailer from 'nodemailer';

let transporter = null;

const initializeTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
};

initializeTransporter();

export const sendEmailNotification = async ({ to, subject, html, text }) => {
  // Graceful delivery: Log to console in development or if SMTP is unconfigured
  if (!transporter) {
    console.log(`[HostGuard Mailer - Simulated Delivery]
To: ${to}
Subject: ${subject}
Preview: ${text || subject}
--------------------------------------------------`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'HostGuard Security <noreply@hostguard.lnmiit.ac.in>',
      to,
      subject,
      text,
      html
    });
    console.log(`[HostGuard Mailer] Sent email to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[HostGuard Mailer Error] Failed to send email to ${to}:`, error.message);
    // Never throw to preserve caller business transaction (FR-052)
    return { success: false, error: error.message };
  }
};
