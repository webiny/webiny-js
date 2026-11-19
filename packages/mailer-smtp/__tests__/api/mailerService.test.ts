import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { MailerService } from "@webiny/api-mailer/domain/MailerService/abstractions.js";
import { MailTransport } from "@webiny/api-mailer/domain/MailTransport/abstractions.js";
import { MailTransportFactory } from "@webiny/api-mailer/domain/MailTransport/abstractions.js";
import { MailerServiceFeature } from "@webiny/api-mailer/features/MailerService/feature.js";
import { SmtpTransportFeature } from "~/api/features/SmtpTransport/feature.js";
import { GetSettingsRepository } from "~/api/features/GetSettings/abstractions.js";
import { NoTransportAvailableError } from "@webiny/api-mailer/domain/MailerService/errors.js";
import type { TransportSettings } from "~/api/types.js";

const SMTP_SETTINGS: TransportSettings = {
    host: "smtp.example.com",
    port: 587,
    secure: false,
    user: "user",
    password: "password",
    from: "noreply@example.com",
    replyTo: "support@example.com"
};

/*
 * A transport configured outside the mailer settings, the way an SES transport would read
 * environment variables. With `send` null it is not configured.
 */
const createProjectFactory = (send: MailTransport.Interface["send"] | null) => {
    class ProjectTransportFactory implements MailTransportFactory.Interface {
        public readonly name = "Acme/SesTransport";

        async createTransport() {
            if (!send) {
                return null;
            }
            return { name: this.name, send };
        }
    }

    return MailTransportFactory.createImplementation({
        implementation: ProjectTransportFactory,
        dependencies: []
    });
};

interface SetupParams {
    smtpSettings: TransportSettings | null;
    project?: ReturnType<typeof createProjectFactory>;
}

const setup = ({ smtpSettings, project }: SetupParams) => {
    const container = new Container();
    const get = vi.fn(async () => Result.ok({ settings: smtpSettings, source: null }));

    container.registerInstance(GetSettingsRepository, { get });
    SmtpTransportFeature.register(container);
    if (project) {
        container.register(project).inSingletonScope();
    }
    MailerServiceFeature.register(container);

    return { mailer: container.resolve(MailerService), get };
};

describe("MailerService", () => {
    it("is not configured when no transport is configured", async () => {
        const { mailer } = setup({ smtpSettings: null });

        expect(await mailer.isConfigured()).toBe(false);
    });

    it("fails a send with NoTransportAvailableError when no transport is configured", async () => {
        const { mailer } = setup({ smtpSettings: null });

        const result = await mailer.sendMail({ to: ["a@example.com"], subject: "Hi", text: "Hi" });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error).toBeInstanceOf(NoTransportAvailableError);
    });

    it("is configured once SMTP settings exist", async () => {
        const { mailer } = setup({ smtpSettings: SMTP_SETTINGS });

        expect(await mailer.isConfigured()).toBe(true);
    });

    it("sends through a project transport that needs no stored settings", async () => {
        const send = vi.fn(async () => ({ result: "queued", error: null }));
        const { mailer } = setup({ smtpSettings: null, project: createProjectFactory(send) });

        expect(await mailer.isConfigured()).toBe(true);
        const result = await mailer.sendMail({ to: ["a@example.com"], subject: "Hi", text: "Hi" });

        expect(result.isOk()).toBe(true);
        expect(send).toHaveBeenCalledTimes(1);
    });

    it("skips a project transport that is not configured", async () => {
        const { mailer, get } = setup({
            smtpSettings: SMTP_SETTINGS,
            project: createProjectFactory(null)
        });

        expect(await mailer.isConfigured()).toBe(true);
        expect(get).toHaveBeenCalledWith("Mailer/SmtpTransport");
    });

    it("does not read SMTP settings when a project transport is configured", async () => {
        const send = vi.fn(async () => ({ result: "queued", error: null }));
        const { mailer, get } = setup({
            smtpSettings: SMTP_SETTINGS,
            project: createProjectFactory(send)
        });

        await mailer.isConfigured();

        expect(get).not.toHaveBeenCalled();
    });
});
