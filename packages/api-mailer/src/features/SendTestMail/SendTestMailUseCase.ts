import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { SendTestMailUseCase } from "./abstractions.js";
import { MailerService } from "~/domain/MailerService/abstractions.js";
import { SendMailUseCase } from "~/features/SendMail/abstractions.js";
import { TestMailNotAuthorized } from "~/domain/errors.js";
import { TestMailNotConfigured } from "~/domain/errors.js";
import { MAILER_SETTINGS_PERMISSION } from "~/constants.js";

const TEST_MAIL_TEXT = [
    "This is a test email from Webiny.",
    "",
    "It was sent from the Mailer settings screen to check that mail is delivered. " +
        "No action is needed."
].join("\n");

class SendTestMailUseCaseImpl implements SendTestMailUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private mailerService: MailerService.Interface,
        private sendMailUseCase: SendMailUseCase.Interface
    ) {}

    async execute(input: SendTestMailUseCase.Input): SendTestMailUseCase.Return {
        const permission = await this.identityContext.getPermission(MAILER_SETTINGS_PERMISSION);
        if (!permission) {
            return Result.fail(new TestMailNotAuthorized());
        }

        /*
         * Through the dummy transport the test would report success without sending anything, so
         * a test that passed would prove nothing.
         */
        if (!(await this.mailerService.canSend())) {
            return Result.fail(new TestMailNotConfigured());
        }

        const result = await this.sendMailUseCase.execute({
            to: [input.to],
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
    dependencies: [IdentityContext, MailerService, SendMailUseCase]
});
