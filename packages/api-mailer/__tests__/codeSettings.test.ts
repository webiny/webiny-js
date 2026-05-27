import { describe, it, expect } from "vitest";
import { createContextHandler } from "./contextHandler";
import { CodeMailerSettings } from "~/domain/CodeMailerSettings/abstractions.js";
import { registerCodeSmtpSettings } from "./helpers/registerCodeSmtpSettings";

const smtpSettings = {
    host: "smtp.example.com",
    port: 587,
    secure: false,
    user: "user@example.com",
    password: "secret-password",
    from: "noreply@example.com",
    replyTo: "support@example.com"
};

describe("CodeMailerSettings", () => {
    it("returns null for any transport when no BuildParam is registered", async () => {
        const { handle } = createContextHandler();
        const context = await handle();
        const codeSettings = context.container.resolve(CodeMailerSettings);

        expect(codeSettings.get("Mailer/SmtpTransport")).toBeNull();
        expect(codeSettings.get("Mailer/DummyTransport")).toBeNull();
        expect(codeSettings.get("nonexistent")).toBeNull();
    });

    it("returns SMTP settings when the BuildParam is registered and the transport matches", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(smtpSettings)]
        });
        const context = await handle();
        const codeSettings = context.container.resolve(CodeMailerSettings);

        expect(codeSettings.get("Mailer/SmtpTransport")).toEqual(smtpSettings);
    });

    it("returns null for non-SMTP transports even when the BuildParam is registered", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(smtpSettings)]
        });
        const context = await handle();
        const codeSettings = context.container.resolve(CodeMailerSettings);

        expect(codeSettings.get("Mailer/DummyTransport")).toBeNull();
        expect(codeSettings.get("nonexistent")).toBeNull();
    });
});
