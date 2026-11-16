import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { SendMailUseCase } from "@webiny/api-mailer/features/SendMail/index.js";
import { MailTransportResolver } from "@webiny/api-mailer/domain/MailTransport/abstractions.js";
import { DUMMY_TRANSPORT_NAME } from "@webiny/api-mailer/constants.js";
import { SMTP_TRANSPORT_NAME } from "@webiny/api-mailer/constants.js";
import { PasswordResetMailer } from "~/api/domain/mail/PasswordResetMailer.js";
import { PasswordResetMailerFeature } from "~/api/domain/mail/PasswordResetMailer.js";

type Resolved = MailTransportResolver.Resolved;

const resolvedAs = (name: string, settings: Resolved["settings"]): Resolved => {
    return {
        factory: {
            name,
            canUse: () => true,
            createTransport: async () => {
                throw new Error("Not used by these tests.");
            }
        },
        settings
    };
};

const setup = (resolved: Resolved | null) => {
    const container = new Container();
    const execute = vi.fn(async () => Result.ok({}));

    container.registerInstance(MailTransportResolver, { resolve: async () => resolved });
    container.registerInstance(SendMailUseCase, {
        execute
    } as unknown as SendMailUseCase.Interface);

    PasswordResetMailerFeature.register(container);

    return { mailer: container.resolve(PasswordResetMailer), execute };
};

const PARAMS = { email: "admin@example.com", code: "123456" };

describe("PasswordResetMailer", () => {
    it("is not configured when no transport can be used", async () => {
        const { mailer, execute } = setup(null);

        expect(await mailer.isConfigured()).toBe(false);
        expect(await mailer.send(PARAMS)).toBe(false);
        expect(execute).not.toHaveBeenCalled();
    });

    it("is not configured when mail would go out through the dummy transport", async () => {
        const { mailer, execute } = setup(resolvedAs(DUMMY_TRANSPORT_NAME, null));

        expect(await mailer.isConfigured()).toBe(false);
        expect(await mailer.send(PARAMS)).toBe(false);
        expect(execute).not.toHaveBeenCalled();
    });

    it("sends through SMTP with the sender from its settings", async () => {
        const { mailer, execute } = setup(
            resolvedAs(SMTP_TRANSPORT_NAME, {
                host: "smtp.example.com",
                port: 587,
                secure: false,
                user: "user",
                password: "password",
                from: "noreply@example.com",
                replyTo: "support@example.com"
            })
        );

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

    it("sends through a transport registered by the project, which has no stored settings", async () => {
        const { mailer, execute } = setup(resolvedAs("Acme/SesTransport", null));

        expect(await mailer.isConfigured()).toBe(true);
        expect(await mailer.send(PARAMS)).toBe(true);
        expect(execute).toHaveBeenCalledWith(
            expect.objectContaining({ to: ["admin@example.com"], from: undefined })
        );
    });

    it("reports a send the mailer refused", async () => {
        const { mailer, execute } = setup(resolvedAs("Acme/SesTransport", null));
        execute.mockResolvedValueOnce(Result.fail(new Error("Refused.")) as any);

        expect(await mailer.send(PARAMS)).toBe(false);
    });
});
