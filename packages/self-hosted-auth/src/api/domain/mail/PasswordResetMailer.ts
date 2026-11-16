import { createAbstraction } from "@webiny/feature/api";
import { createFeature } from "@webiny/feature/api";
import { SendMailUseCase } from "@webiny/api-mailer/features/SendMail/index.js";
import { MailTransportResolver } from "@webiny/api-mailer/domain/MailTransport/abstractions.js";
import { DUMMY_TRANSPORT_NAME } from "@webiny/api-mailer/constants.js";
import { RESET_CODE_TTL_MINUTES } from "~/api/domain/passwordResetPolicy.js";

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
 * lives in one replaceable place, a project that wants a different message can swap it, and the
 * use case tests can assert what would have been sent without a transport in sight.
 */
export const PasswordResetMailer = createAbstraction<IPasswordResetMailer>("PasswordResetMailer");

export namespace PasswordResetMailer {
    export type Interface = IPasswordResetMailer;
    export type SendParams = SendPasswordResetCodeParams;
}

class MailerServicePasswordResetMailer implements IPasswordResetMailer {
    constructor(
        private sendMailUseCase: SendMailUseCase.Interface,
        private transportResolver: MailTransportResolver.Interface
    ) {}

    async isConfigured(): Promise<boolean> {
        const transport = await this.resolveTransport();

        return transport !== null;
    }

    async send(params: SendPasswordResetCodeParams): Promise<boolean> {
        const transport = await this.resolveTransport();
        if (!transport) {
            return false;
        }

        const result = await this.sendMailUseCase.execute({
            to: [params.email],
            from: transport.settings?.from || undefined,
            replyTo: transport.settings?.replyTo || undefined,
            subject: "Your password reset code",
            text: buildBody(params.code)
        });

        return result.isOk();
    }

    /**
     * The transport the mailer would deliver through, or null when that is the dummy one. The dummy
     * transport is always available and reports success without sending, so a reset sent through it
     * would tell the user to check an inbox nothing arrives in.
     */
    private async resolveTransport(): Promise<MailTransportResolver.Resolved | null> {
        const resolved = await this.transportResolver.resolve();
        if (!resolved || resolved.factory.name === DUMMY_TRANSPORT_NAME) {
            return null;
        }

        return resolved;
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
    dependencies: [SendMailUseCase, MailTransportResolver]
});

export const PasswordResetMailerFeature = createFeature({
    name: "PasswordResetMailer",
    register(container) {
        container.register(mailerServicePasswordResetMailer);
    }
});
