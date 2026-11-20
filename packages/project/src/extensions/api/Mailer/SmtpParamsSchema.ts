import { z } from "zod";
import emailAddresses from "email-addresses";

// Accept both addr-spec ("foo@bar.com") and name-addr ("Foo <foo@bar.com>") forms.
const isMailboxAddress = (value: string): boolean => {
    return emailAddresses.parseOneAddress(value) !== null;
};

const mailboxAddress = z.string().refine(isMailboxAddress, { message: "Invalid email address." });

export const SmtpParamsSchema = z.object({
    host: z.string().min(1).describe("SMTP server hostname."),
    port: z.number().int().positive().describe("SMTP server port."),
    user: z.string().min(1).describe("SMTP authentication username."),
    password: z
        .string()
        .min(1)
        .describe(
            "SMTP authentication password. Pass via env var (e.g. `process.env.SMTP_PASSWORD!`), never hard-code."
        ),
    from: mailboxAddress.describe("Default 'from' address."),
    replyTo: mailboxAddress.optional().describe("Default 'reply-to' address.")
});
