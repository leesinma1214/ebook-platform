import nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";

interface VerificationMailOptions {
  link: string;
  to: string;
  name?: string;
}

const isProduction = process.env.NODE_ENV === "production";

// Sandbox transport for development
const sandboxTransport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_TEST_USER,
    pass: process.env.MAILTRAP_TEST_PASS,
  },
});

// Production transport for real emails
const productionTransport = nodemailer.createTransport(
  MailtrapTransport({
    token: process.env.MAILTRAP_TOKEN!,
  })
);

const transport = isProduction ? productionTransport : sandboxTransport;

const sender = {
  address: process.env.VERIFICATION_MAIL || "hello@digiread.store",
  name: "DigiRead Store",
};

const mail = {
  async sendVerificationMail(options: VerificationMailOptions) {
    // Use template in production, HTML in development
    if (isProduction) {
      await transport.sendMail({
        from: sender,
        to: options.to,
        templateUuid:
          process.env.MAILTRAP_TEMPLATE_UUID ||
          "fd3eb5e2-35e9-45a9-983d-0938e5e6c913",
        templateVariables: {
          user_name: options.name || "User",
          next_step_link: options.link,
        },
      });
    } else {
      // Sandbox fallback with HTML
      await transport.sendMail({
        to: options.to,
        from: sender.address,
        subject: "Auth Verification",
        html: `
          <div>
            <p>Hello ${options.name || "User"},</p>
            <p>Please click on <a href="${
              options.link
            }">this link</a> to verify your account.</p>
          </div> 
        `,
      });
    }
  },
};

export default mail;
