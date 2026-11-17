import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { MailerService } from "~/domain/MailerService/abstractions.js";
import { MailTransport } from "~/domain/MailTransport/abstractions.js";
import { MailTransportFactory } from "~/domain/MailTransport/abstractions.js";
import { MailerServiceFeature } from "~/features/MailerService/feature.js";
import { DummyTransportFeature } from "~/features/DummyTransport/feature.js";
import { SmtpTransportFeature } from "~/features/SmtpTransport/feature.js";
import { GetSettingsRepository } from "~/features/GetSettings/abstractions.js";
import type { TransportSettings } from "~/types.js";

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
    DummyTransportFeature.register(container);
    SmtpTransportFeature.register(container);
    if (project) {
        container.register(project).inSingletonScope();
    }
    MailerServiceFeature.register(container);

    return { mailer: container.resolve(MailerService), get };
};

describe("MailerService", () => {
    it("cannot send when only the dummy transport is left", async () => {
        const { mailer } = setup({ smtpSettings: null });

        expect(await mailer.canSend()).toBe(false);
    });

    it("can send once SMTP settings exist", async () => {
        const { mailer } = setup({ smtpSettings: SMTP_SETTINGS });

        expect(await mailer.canSend()).toBe(true);
    });

    it("sends through a project transport that needs no stored settings", async () => {
        const send = vi.fn(async () => ({ result: "queued", error: null }));
        const { mailer } = setup({ smtpSettings: null, project: createProjectFactory(send) });

        expect(await mailer.canSend()).toBe(true);
        const result = await mailer.sendMail({ to: ["a@example.com"], subject: "Hi", text: "Hi" });

        expect(result.isOk()).toBe(true);
        expect(send).toHaveBeenCalledTimes(1);
    });

    it("skips a project transport that is not configured", async () => {
        const { mailer, get } = setup({
            smtpSettings: SMTP_SETTINGS,
            project: createProjectFactory(null)
        });

        expect(await mailer.canSend()).toBe(true);
        expect(get).toHaveBeenCalledWith("Mailer/SmtpTransport");
    });

    it("does not read SMTP settings when a project transport is configured", async () => {
        const send = vi.fn(async () => ({ result: "queued", error: null }));
        const { mailer, get } = setup({
            smtpSettings: SMTP_SETTINGS,
            project: createProjectFactory(send)
        });

        await mailer.canSend();

        expect(get).not.toHaveBeenCalled();
    });
});
