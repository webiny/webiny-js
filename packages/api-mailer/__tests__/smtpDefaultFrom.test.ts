import { beforeEach, describe, expect, it, vi } from "vitest";
import { SmtpMailTransport } from "~/features/SmtpTransport/SmtpMailTransport.js";
import { SendMailUseCase } from "~/features/SendMail/abstractions.js";
import { createContextHandler } from "./contextHandler";
import { registerCodeSmtpSettings } from "./helpers/registerCodeSmtpSettings";
import type { TransportSendData, TransportSettings } from "~/types";

const nodemailerMock = vi.hoisted(() => {
    return { sendMail: vi.fn() };
});

vi.mock("nodemailer", () => {
    return {
        default: {
            createTransport: () => {
                return { sendMail: nodemailerMock.sendMail };
            }
        }
    };
});

const settings: TransportSettings = {
    host: "code-host.webiny",
    port: 587,
    secure: false,
    user: "code-user",
    password: "code-password",
    from: "settings-from@example.com",
    replyTo: "settings-reply@example.com"
};

const baseMail: TransportSendData = {
    bcc: ["bcc@dummy-host.webiny"],
    subject: "Some dummy subject",
    text: "Some dummy body"
};

describe("SMTP transport default from (R201)", () => {
    beforeEach(() => {
        nodemailerMock.sendMail.mockReset();
        nodemailerMock.sendMail.mockResolvedValue({ messageId: "123", response: "ok" });
    });

    it("uses the default from when the caller passes none", async () => {
        const transport = new SmtpMailTransport({}, "settings-from@example.com");

        const response = await transport.send(baseMail);

        expect(response).toEqual({ result: "ok", error: null });
        expect(nodemailerMock.sendMail).toHaveBeenCalledTimes(1);
        expect(nodemailerMock.sendMail.mock.calls[0][0].from).toBe("settings-from@example.com");
    });

    it("keeps an explicit from from the caller", async () => {
        const transport = new SmtpMailTransport({}, "settings-from@example.com");

        await transport.send({ ...baseMail, from: "caller@example.com" });

        expect(nodemailerMock.sendMail.mock.calls[0][0].from).toBe("caller@example.com");
    });

    it("leaves replyTo untouched", async () => {
        const transport = new SmtpMailTransport({}, "settings-from@example.com");

        await transport.send(baseMail);
        await transport.send({ ...baseMail, replyTo: "caller-reply@example.com" });

        expect(nodemailerMock.sendMail.mock.calls[0][0].replyTo).toBeUndefined();
        expect(nodemailerMock.sendMail.mock.calls[1][0].replyTo).toBe("caller-reply@example.com");
    });

    it("sends no from when there is no default and the caller passes none (unchanged behaviour)", async () => {
        const withoutDefault = new SmtpMailTransport({});
        const emptyDefault = new SmtpMailTransport({}, "");

        await withoutDefault.send(baseMail);
        await emptyDefault.send(baseMail);

        expect(nodemailerMock.sendMail.mock.calls[0][0].from).toBeUndefined();
        expect(nodemailerMock.sendMail.mock.calls[1][0].from).toBeUndefined();
    });

    it("sendMail without from reaches nodemailer with the configured settings from", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(settings)]
        });
        const context = await handle();
        const sendMail = context.container.resolve(SendMailUseCase);

        const result = await sendMail.execute(baseMail);

        expect(result.isOk()).toBe(true);
        expect(nodemailerMock.sendMail.mock.calls[0][0].from).toBe("settings-from@example.com");
    });

    it("sendMail with an explicit from keeps it end to end", async () => {
        const { handle } = createContextHandler({
            plugins: [registerCodeSmtpSettings(settings)]
        });
        const context = await handle();
        const sendMail = context.container.resolve(SendMailUseCase);

        const result = await sendMail.execute({ ...baseMail, from: "caller@example.com" });

        expect(result.isOk()).toBe(true);
        expect(nodemailerMock.sendMail.mock.calls[0][0].from).toBe("caller@example.com");
    });
});
