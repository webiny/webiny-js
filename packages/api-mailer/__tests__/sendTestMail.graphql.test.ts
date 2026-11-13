import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGraphQLHandler } from "./graphQLHandler";
import { registerCodeSmtpSettings } from "./helpers/registerCodeSmtpSettings";

const { sendMail, createTransport } = vi.hoisted(() => {
    const sendMail = vi.fn();
    const createTransport = vi.fn(() => ({ sendMail }));
    return { sendMail, createTransport };
});

vi.mock("nodemailer", () => {
    return {
        default: { createTransport }
    };
});

const storedSettings = {
    host: "dummy-host.webiny",
    user: "user",
    password: "password",
    from: "from@dummy-host.webiny",
    replyTo: "replyTo@dummy-host.webiny"
};

describe("Mailer sendTestMail GraphQL", () => {
    beforeEach(() => {
        sendMail.mockReset();
        createTransport.mockClear();
        sendMail.mockResolvedValue({ messageId: "123", response: "250 OK" });
    });

    it("sends through the saved SMTP settings", async () => {
        const handler = createGraphQLHandler();
        await handler.saveSettings({ data: storedSettings });

        const [response] = await handler.sendTestMail({ to: "admin@dummy-host.webiny" });

        expect(response).toEqual({
            data: { mailer: { sendTestMail: { data: true, error: null } } }
        });
        expect(createTransport).toHaveBeenCalledWith(
            expect.objectContaining({
                host: "dummy-host.webiny",
                auth: { user: "user", pass: "password" }
            })
        );
        expect(sendMail).toHaveBeenCalledTimes(1);
        expect(sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: ["admin@dummy-host.webiny"],
                from: "from@dummy-host.webiny",
                replyTo: "replyTo@dummy-host.webiny",
                subject: "Webiny test email"
            })
        );
    });

    it("returns the SMTP server's error when delivery fails", async () => {
        sendMail.mockRejectedValue(
            Object.assign(new Error("Invalid login: 535 Authentication failed"), {
                code: "EAUTH",
                command: "AUTH PLAIN",
                responseCode: 535,
                response: "535 Authentication failed"
            })
        );
        const handler = createGraphQLHandler();
        await handler.saveSettings({ data: storedSettings });

        const [response] = await handler.sendTestMail({ to: "admin@dummy-host.webiny" });

        const result = response.data.mailer.sendTestMail;
        expect(result.data).toBeNull();
        expect(result.error).toMatchObject({
            code: "Mailer/MailerService/TransportSendError",
            message: "Invalid login: 535 Authentication failed",
            data: {
                error: {
                    code: "EAUTH",
                    data: { responseCode: 535, response: "535 Authentication failed" }
                }
            }
        });
        expect(JSON.stringify(result.error)).not.toContain("password");
    });

    it("refuses when no SMTP settings exist, instead of reporting the dummy transport's success", async () => {
        const handler = createGraphQLHandler();

        const [response] = await handler.sendTestMail({ to: "admin@dummy-host.webiny" });

        expect(response).toEqual({
            data: {
                mailer: {
                    sendTestMail: {
                        data: null,
                        error: {
                            code: "Mailer/SendTestMail/NotConfigured",
                            message:
                                "SMTP settings are not configured, so there is nothing to test.",
                            data: null
                        }
                    }
                }
            }
        });
        expect(createTransport).not.toHaveBeenCalled();
    });

    it("refuses without the mailer.settings permission", async () => {
        const handler = createGraphQLHandler({
            permissions: [],
            plugins: [registerCodeSmtpSettings({ ...storedSettings, port: 587, secure: false })]
        });

        const [response] = await handler.sendTestMail({ to: "admin@dummy-host.webiny" });

        expect(response.data.mailer.sendTestMail).toEqual({
            data: null,
            error: {
                code: "Mailer/SendTestMail/NotAuthorized",
                message: "Not allowed to send a test email.",
                data: null
            }
        });
        expect(sendMail).not.toHaveBeenCalled();
    });

    it("tests settings that are managed by code", async () => {
        const handler = createGraphQLHandler({
            plugins: [
                registerCodeSmtpSettings({
                    host: "code-host.webiny",
                    port: 587,
                    secure: false,
                    user: "code-user",
                    password: "code-password",
                    from: "code-from@example.com"
                })
            ]
        });

        const [response] = await handler.sendTestMail({ to: "admin@dummy-host.webiny" });

        expect(response.data.mailer.sendTestMail).toEqual({ data: true, error: null });
        expect(sendMail).toHaveBeenCalledWith(
            expect.objectContaining({ from: "code-from@example.com", replyTo: undefined })
        );
    });

    it("rejects an invalid recipient before connecting", async () => {
        const handler = createGraphQLHandler();
        await handler.saveSettings({ data: storedSettings });

        const [response] = await handler.sendTestMail({ to: "not-an-address" });

        expect(response.data.mailer.sendTestMail.error.code).toBe("Mailer/SendMail/Validation");
        expect(sendMail).not.toHaveBeenCalled();
    });
});
