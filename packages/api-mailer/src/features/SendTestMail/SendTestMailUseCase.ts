import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { SendTestMailUseCase } from "./abstractions.js";
import { MailTransportResolver } from "~/domain/MailTransport/abstractions.js";
import { SendMailUseCase } from "~/features/SendMail/abstractions.js";
import { TestMailNotAuthorized } from "~/domain/errors.js";
import { TestMailNotConfigured } from "~/domain/errors.js";
import { DUMMY_TRANSPORT_NAME } from "~/constants.js";
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
        private transportResolver: MailTransportResolver.Interface,
        private sendMailUseCase: SendMailUseCase.Interface
    ) {}

    async execute(input: SendTestMailUseCase.Input): SendTestMailUseCase.Return {
        const permission = await this.identityContext.getPermission(MAILER_SETTINGS_PERMISSION);
        if (!permission) {
            return Result.fail(new TestMailNotAuthorized());
        }

        /*
         * The test goes out through whichever transport delivers this project's mail. When that
         * is the dummy transport, it would report success without sending anything, so a test
         * that passed would prove nothing.
         */
        const resolved = await this.transportResolver.resolve();
        if (!resolved || resolved.factory.name === DUMMY_TRANSPORT_NAME) {
            return Result.fail(new TestMailNotConfigured());
        }

        const result = await this.sendMailUseCase.execute({
            to: [input.to],
            from: resolved.settings?.from || undefined,
            replyTo: resolved.settings?.replyTo || undefined,
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
    dependencies: [IdentityContext, MailTransportResolver, SendMailUseCase]
});
