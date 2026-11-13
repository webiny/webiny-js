import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "vitest";
import type { Container } from "@webiny/di";
import { createGraphQLHandler } from "./graphQLHandler";
import { registerCodeSmtpSettings } from "./helpers/registerCodeSmtpSettings";
import { MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import type { TransportSendData } from "~/types.js";

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
        const expectedConfig = expect.objectContaining({
            host: "dummy-host.webiny",
            auth: { user: "user", pass: "password" }
        });
        expect(createTransport).toHaveBeenCalledWith(expectedConfig);
        expect(sendMail).toHaveBeenCalledTimes(1);
        const expectedMessage = expect.objectContaining({
            to: ["admin@dummy-host.webiny"],
            from: "from@dummy-host.webiny",
            replyTo: "replyTo@dummy-host.webiny",
            subject: "Webiny test email"
        });
        expect(sendMail).toHaveBeenCalledWith(expectedMessage);
    });

    it("returns the SMTP server's error when delivery fails", async () => {
        const smtpError = Object.assign(new Error("Invalid login: 535 Authentication failed"), {
            code: "EAUTH",
            command: "AUTH PLAIN",
            responseCode: 535,
            response: "535 Authentication failed"
        });
        sendMail.mockRejectedValue(smtpError);
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
        const serializedError = JSON.stringify(result.error);
        expect(serializedError).not.toContain("password");
    });

    it("refuses when only the dummy transport is available, instead of reporting its success", async () => {
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
                                "No mail transport is configured, so there is nothing to test.",
                            data: null
                        }
                    }
                }
            }
        });
        expect(createTransport).not.toHaveBeenCalled();
    });

    it("refuses without the mailer.settings permission", async () => {
        const codeSmtpSettings = registerCodeSmtpSettings({
            ...storedSettings,
            port: 587,
            secure: false
        });
        const handler = createGraphQLHandler({ permissions: [], plugins: [codeSmtpSettings] });

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
        const codeSmtpSettings = registerCodeSmtpSettings({
            host: "code-host.webiny",
            port: 587,
            secure: false,
            user: "code-user",
            password: "code-password",
            from: "code-from@example.com"
        });
        const handler = createGraphQLHandler({ plugins: [codeSmtpSettings] });

        const [response] = await handler.sendTestMail({ to: "admin@dummy-host.webiny" });

        expect(response.data.mailer.sendTestMail).toEqual({ data: true, error: null });
        const expectedMessage = expect.objectContaining({
            from: "code-from@example.com",
            replyTo: undefined
        });
        expect(sendMail).toHaveBeenCalledWith(expectedMessage);
    });

    it("goes through a transport the project registers, not SMTP", async () => {
        const projectTransportSend = vi.fn(async (_params: TransportSendData) => {
            return { result: "queued", error: null };
        });

        class ProjectTransportFactory implements MailTransportFactory.Interface {
            public readonly name = "Project/Transport";

            canUse(): boolean {
                return true;
            }

            async createTransport() {
                return { name: this.name, send: projectTransportSend };
            }
        }

        const registerProjectTransport = (container: Container) => {
            const implementation = MailTransportFactory.createImplementation({
                implementation: ProjectTransportFactory,
                dependencies: []
            });
            container.register(implementation);
        };
        const handler = createGraphQLHandler({ plugins: [registerProjectTransport] });

        const [response] = await handler.sendTestMail({ to: "admin@dummy-host.webiny" });

        expect(response.data.mailer.sendTestMail).toEqual({ data: true, error: null });
        expect(projectTransportSend).toHaveBeenCalledTimes(1);
        expect(createTransport).not.toHaveBeenCalled();
    });

    it("rejects an invalid recipient before connecting", async () => {
        const handler = createGraphQLHandler();
        await handler.saveSettings({ data: storedSettings });

        const [response] = await handler.sendTestMail({ to: "not-an-address" });

        expect(response.data.mailer.sendTestMail.error.code).toBe("Mailer/SendMail/Validation");
        expect(sendMail).not.toHaveBeenCalled();
    });
});
