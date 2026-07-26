/**
 * Email provider seam.
 *
 * Gmail (Google Workspace on connectthedots.co.nz) is the provider for
 * testing, with a bespoke sending domain expected before go-live — so
 * everything above this file talks to `EmailProvider` and never to
 * nodemailer. Swapping in SES/Postmark/Resend later should mean adding one
 * module here and changing `EMAIL_PROVIDER`, nothing else.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailProvider = {
  /** Human-readable id for logs and the admin UI ("gmail", "console"). */
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
};

export class EmailNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailNotConfiguredError";
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new EmailNotConfiguredError(
      `${name} is not set — see .env.example for the email settings.`
    );
  }
  return value;
}

/**
 * Gmail SMTP via an App Password on a Workspace account.
 *
 * App Password (not the account password) is required, and the account must
 * have 2-Step Verification enabled. Workspace SMTP also caps daily
 * recipients, which is fine for pilot-sized teams but is a reason to move to
 * a transactional provider before self-serve signup.
 */
async function createGmailProvider(): Promise<EmailProvider> {
  const user = requireEnv("GMAIL_USER");
  const pass = requireEnv("GMAIL_APP_PASSWORD");
  const from = process.env.EMAIL_FROM?.trim() || user;
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || undefined;

  // Imported lazily so the Edge middleware bundle never pulls in nodemailer.
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS on 587
    auth: { user, pass },
  });

  return {
    name: "gmail",
    async send(message) {
      await transport.sendMail({
        from,
        replyTo,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
    },
  };
}

/** Writes the message to the server log instead of sending. Local development only. */
function createConsoleProvider(): EmailProvider {
  return {
    name: "console",
    async send(message) {
      console.info(
        `[email:console] to=${message.to} subject=${message.subject}\n${message.text}`
      );
    },
  };
}

/**
 * Resolves the configured provider, or throws EmailNotConfiguredError.
 *
 * Deliberately explicit: with `EMAIL_PROVIDER` unset, queued notifications
 * stay PENDING and the admin UI says email isn't configured. Silently
 * swallowing sends — or silently logging them in production — would look
 * identical to working.
 */
export async function getEmailProvider(): Promise<EmailProvider> {
  const configured = (process.env.EMAIL_PROVIDER ?? "").trim().toLowerCase();

  switch (configured) {
    case "gmail":
      return createGmailProvider();
    case "console":
      return createConsoleProvider();
    case "":
      throw new EmailNotConfiguredError(
        "EMAIL_PROVIDER is not set, so member notifications stay queued."
      );
    default:
      throw new EmailNotConfiguredError(`Unknown EMAIL_PROVIDER “${configured}”.`);
  }
}
