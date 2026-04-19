import { describe, it, expect, vi } from "vitest";
import { createContextHandler } from "./contextHandler";
import { GetSettingsUseCase } from "~/features/GetSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/features/SaveSettings/abstractions.js";
import { SendMailUseCase } from "~/features/SendMail/abstractions.js";
import { registerCodeSmtpSettings } from "./helpers/registerCodeSmtpSettings";
import type { TransportSendData } from "~/types";

vi.mock("nodemailer", () => {
    return {
        default: {
            createTransport: () => {
                return {
                    sendMail: async (params: TransportSendData) => {
                        return {
                            envelope: "envelope",
                            messageId: "123",
                            accepted: [params.to],
                            rejected: [],
                            pending: [],
                            response: "ok"
                        };
                    }
                };
            }
        }
    };
});

const codeSettings = {
    host: "code-host.webiny",
    port: 587,
    user: "code-user",
    password: "code-password",
    from: "code-from@example.com",
    replyTo: "code-reply@example.com"
};

describe("Mailer settings — code source end-to-end", () => {
    it("getSettings returns code-sourced data and source='code'", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(codeSettings)]
        });
        const context = await handle();

        const getSettings = context.container.resolve(GetSettingsUseCase);
        const result = await getSettings.execute("Mailer/SmtpTransport");

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            settings: codeSettings,
            source: "code"
        });
    });

    it("saveSettings fails with SettingsLockedByCode when code settings exist", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(codeSettings)]
        });
        const context = await handle();

        const saveSettings = context.container.resolve(SaveSettingsUseCase);
        const result = await saveSettings.execute({
            host: "ignored.webiny",
            user: "ignored",
            password: "ignored",
            from: "ignored@example.com"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Mailer/Settings/LockedByCode");
    });

    it("sendMail succeeds using code-sourced SMTP settings", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(codeSettings)]
        });
        const context = await handle();

        const sendMail = context.container.resolve(SendMailUseCase);
        const result = await sendMail.execute({
            to: ["to@example.com"],
            cc: [],
            bcc: [],
            from: "from@example.com",
            subject: "Hello",
            text: "Body"
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            result: "ok",
            error: null
        });
    });
});
