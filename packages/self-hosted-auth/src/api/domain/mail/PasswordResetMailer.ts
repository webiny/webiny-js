import { createAbstraction, createFeature } from "@webiny/feature/api";
import { SendMailUseCase } from "@webiny/api-mailer/features/SendMail/index.js";
import { GetSettingsUseCase } from "@webiny/api-mailer/features/GetSettings/index.js";
import { RESET_CODE_TTL_MINUTES } from "~/api/domain/passwordResetPolicy.js";

/**
 * The transport api-mailer uses for real delivery. Named here because the dummy transport is always
 * available and always claims success, so "can this installation send mail" cannot be answered by
 * attempting a send. It has to be answered by asking whether these settings exist.
 */
const SMTP_TRANSPORT_NAME = "Mailer/SmtpTransport";

export interface SendPasswordResetCodeParams {
    email: string;
    code: string;
}

export interface IPasswordResetMailer {
    /**
     * Whether mail can actually leave this installation. Asked before the account is looked up, so
     * that the answer is the same for an address with an account and one without.
     */
    isConfigured(): Promise<boolean>;

    /** Delivers the code. Returns false if the transport refused it; the caller decides what that means. */
    send(params: SendPasswordResetCodeParams): Promise<boolean>;
}

/**
 * Turns a reset code into a message and hands it to the mailer.
 *
 * A seam rather than a call to `SendMailUseCase` inside the use case, for three reasons: the wording
 * lives in one replaceable place, a project that sends through something other than SMTP can swap
 * it, and the use case tests can assert what would have been sent without a transport in sight.
 */
export const PasswordResetMailer = createAbstraction<IPasswordResetMailer>("PasswordResetMailer");

export namespace PasswordResetMailer {
    export type Interface = IPasswordResetMailer;
    export type SendParams = SendPasswordResetCodeParams;
}

class MailerServicePasswordResetMailer implements IPasswordResetMailer {
    constructor(
        private sendMailUseCase: SendMailUseCase.Interface,
        private getSettingsUseCase: GetSettingsUseCase.Interface
    ) {}

    async isConfigured(): Promise<boolean> {
        const settings = await this.readSmtpSettings();

        return settings !== null;
    }

    async send(params: SendPasswordResetCodeParams): Promise<boolean> {
        const settings = await this.readSmtpSettings();
        if (!settings) {
            return false;
        }

        const result = await this.sendMailUseCase.execute({
            to: [params.email],
            from: settings.from,
            replyTo: settings.replyTo,
            subject: "Your password reset code",
            text: buildBody(params.code)
        });

        return result.isOk();
    }

    private async readSmtpSettings() {
        const result = await this.getSettingsUseCase.execute(SMTP_TRANSPORT_NAME);
        if (result.isFail()) {
            return null;
        }

        return result.value.settings;
    }
}

/*
 * Plain text, no branding and no link. A link would need the admin origin, which a self-hosted
 * deployment cannot be relied on to know, and the code is what the screen asks for anyway.
 */
const buildBody = (code: string): string => {
    return [
        `Your password reset code is ${code}.`,
        "",
        `It is valid for ${RESET_CODE_TTL_MINUTES} minutes and can be used once.`,
        "",
        "If you did not ask to reset your password, you can ignore this message. Your password " +
            "has not been changed."
    ].join("\n");
};

const mailerServicePasswordResetMailer = PasswordResetMailer.createImplementation({
    implementation: MailerServicePasswordResetMailer,
    dependencies: [SendMailUseCase, GetSettingsUseCase]
});

export const PasswordResetMailerFeature = createFeature({
    name: "PasswordResetMailer",
    register(container) {
        container.register(mailerServicePasswordResetMailer);
    }
});
