import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { SendMailUseCase } from "@webiny/api-mailer/features/SendMail/index.js";
import { DeliveringTransport } from "@webiny/api-mailer/features/MailerService/index.js";
import { PasswordResetMailer } from "~/api/domain/mail/PasswordResetMailer.js";
import { PasswordResetMailerFeature } from "~/api/domain/mail/PasswordResetMailer.js";

const setup = (transport: DeliveringTransport.Resolved | null) => {
    const container = new Container();
    const execute = vi.fn(async (): Promise<Result<unknown, Error>> => Result.ok({}));
    const sendMailUseCase = { execute } as unknown as SendMailUseCase.Interface;

    container.registerInstance(DeliveringTransport, { resolve: async () => transport });
    container.registerInstance(SendMailUseCase, sendMailUseCase);

    PasswordResetMailerFeature.register(container);

    return { mailer: container.resolve(PasswordResetMailer), execute };
};

const PARAMS = { email: "admin@example.com", code: "123456" };

describe("PasswordResetMailer", () => {
    it("is not configured when no transport delivers mail", async () => {
        const { mailer, execute } = setup(null);

        expect(await mailer.isConfigured()).toBe(false);
        expect(await mailer.send(PARAMS)).toBe(false);
        expect(execute).not.toHaveBeenCalled();
    });

    it("sends the code with the sender the transport names", async () => {
        const { mailer, execute } = setup({
            name: "Mailer/SmtpTransport",
            from: "noreply@example.com",
            replyTo: "support@example.com"
        });

        expect(await mailer.isConfigured()).toBe(true);
        expect(await mailer.send(PARAMS)).toBe(true);
        expect(execute).toHaveBeenCalledWith(
            expect.objectContaining({
                to: ["admin@example.com"],
                from: "noreply@example.com",
                replyTo: "support@example.com",
                subject: "Your password reset code"
            })
        );
    });

    it("reports a send the mailer refused", async () => {
        const { mailer, execute } = setup({
            name: "Acme/SesTransport",
            from: undefined,
            replyTo: undefined
        });
        const refused = Result.fail(new Error("Refused."));
        execute.mockResolvedValueOnce(refused);

        expect(await mailer.send(PARAMS)).toBe(false);
    });
});
