import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { SmtpMailTransport } from "~/features/SmtpTransport/SmtpMailTransport.js";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

describe("SmtpMailTransport", () => {
    it("should load nodemailer on the first send and reuse the transporter", async () => {
        // jsonTransport builds the message without connecting to a server.
        const transport = new SmtpMailTransport({ jsonTransport: true } as SMTPTransport.Options);

        const params = {
            from: "sender@example.com",
            to: ["recipient@example.com"],
            subject: "Hello",
            text: "Hello there."
        };

        const first = await transport.send(params);
        const second = await transport.send({ ...params, subject: "Hello again" });

        // A null error means nodemailer was loaded and sendMail returned a messageId.
        expect(first.error).toBeNull();
        expect(second.error).toBeNull();
    });
});
