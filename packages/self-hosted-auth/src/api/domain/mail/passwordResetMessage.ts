import { RESET_CODE_TTL_MINUTES } from "~/api/domain/passwordResetPolicy.js";

export interface PasswordResetMessageParams {
    email: string;
    code: string;
}

/*
 * Plain text, no branding and no link. A link would need the admin origin, which a self-hosted
 * deployment cannot be relied on to know, and the code is what the screen asks for anyway. No sender
 * either: the transport applies its own.
 */
export const createPasswordResetMessage = (params: PasswordResetMessageParams) => {
    return {
        to: [params.email],
        subject: "Your password reset code",
        text: [
            `Your password reset code is ${params.code}.`,
            "",
            `It is valid for ${RESET_CODE_TTL_MINUTES} minutes and can be used once.`,
            "",
            "If you did not ask to reset your password, you can ignore this message. Your password " +
                "has not been changed."
        ].join("\n")
    };
};
