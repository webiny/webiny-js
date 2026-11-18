import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { SendMailUseCase } from "@webiny/api-mailer/features/SendMail/index.js";
import { MailerService } from "@webiny/api-mailer/domain/MailerService/abstractions.js";
import { NoTransportAvailableError } from "@webiny/api-mailer/domain/MailerService/errors.js";
import { PasswordResetMailer } from "~/api/domain/mail/PasswordResetMailer.js";
import { PasswordResetMailerFeature } from "~/api/domain/mail/PasswordResetMailer.js";

const setup = (configured: boolean) => {
    const container = new Container();
    const execute = vi.fn(async (): Promise<Result<unknown, Error>> =>
        configured ? Result.ok({}) : Result.fail(new NoTransportAvailableError())
    );
    const sendMailUseCase = { execute } as unknown as SendMailUseCase.Interface;
    const mailerService = { isConfigured: async () => configured } as MailerService.Interface;

    container.registerInstance(MailerService, mailerService);
    container.registerInstance(SendMailUseCase, sendMailUseCase);

    PasswordResetMailerFeature.register(container);

    return { mailer: container.resolve(PasswordResetMailer), execute };
};

const PARAMS = { email: "admin@example.com", code: "123456" };

describe("PasswordResetMailer", () => {
    it("is not configured when the mailer has no transport, and a send reports false", async () => {
        const { mailer } = setup(false);

        expect(await mailer.isConfigured()).toBe(false);
        expect(await mailer.send(PARAMS)).toBe(false);
    });

    it("sends the code and leaves the sender to the transport", async () => {
        const { mailer, execute } = setup(true);

        expect(await mailer.isConfigured()).toBe(true);
        expect(await mailer.send(PARAMS)).toBe(true);
        const sent = execute.mock.calls[0] as unknown[];
        expect(sent[0]).toEqual({
            to: ["admin@example.com"],
            subject: "Your password reset code",
            text: expect.stringContaining("123456")
        });
    });

    it("reports a send the mailer refused", async () => {
        const { mailer, execute } = setup(true);
        const refused = Result.fail(new Error("Refused."));
        execute.mockResolvedValueOnce(refused);

        expect(await mailer.send(PARAMS)).toBe(false);
    });
});
