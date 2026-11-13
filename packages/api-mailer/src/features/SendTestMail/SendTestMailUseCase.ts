import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { SendTestMailUseCase } from "./abstractions.js";
import { GetSettingsRepository } from "~/features/GetSettings/abstractions.js";
import { SendMailUseCase } from "~/features/SendMail/abstractions.js";
import { TestMailNotAuthorized, TestMailNotConfigured } from "~/domain/errors.js";
import { SMTP_TRANSPORT_NAME } from "~/constants.js";

const TEST_MAIL_TEXT = [
    "This is a test email from Webiny.",
    "",
    "It was sent from the Mailer settings screen to check that the SMTP settings deliver mail. " +
        "No action is needed."
].join("\n");

class SendTestMailUseCaseImpl implements SendTestMailUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getSettingsRepository: GetSettingsRepository.Interface,
        private sendMailUseCase: SendMailUseCase.Interface
    ) {}

    async execute(input: SendTestMailUseCase.Input): SendTestMailUseCase.Return {
        const permission = await this.identityContext.getPermission("mailer.settings");
        if (!permission) {
            return Result.fail(new TestMailNotAuthorized());
        }

        /*
         * Without SMTP settings the mailer falls back to the dummy transport, which reports success
         * without sending anything. A test that passes that way would prove nothing.
         */
        const settingsResult = await this.getSettingsRepository.get(SMTP_TRANSPORT_NAME);
        const settings = settingsResult.isOk() ? settingsResult.value.settings : null;
        if (!settings) {
            return Result.fail(new TestMailNotConfigured());
        }

        const result = await this.sendMailUseCase.execute({
            to: [input.to],
            from: settings.from,
            replyTo: settings.replyTo || undefined,
            subject: "Webiny test email",
            text: TEST_MAIL_TEXT
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(undefined);
    }
}

export const SendTestMailUseCaseImplementation = SendTestMailUseCase.createImplementation({
    implementation: SendTestMailUseCaseImpl,
    dependencies: [IdentityContext, GetSettingsRepository, SendMailUseCase]
});
