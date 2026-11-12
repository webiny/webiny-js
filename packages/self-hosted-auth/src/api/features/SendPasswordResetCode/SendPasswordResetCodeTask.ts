import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Hasher } from "@webiny/api-core/features/hashing/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { CredentialsRepository } from "~/api/repositories/CredentialsRepository.js";
import { PasswordResetCodesRepository } from "~/api/repositories/PasswordResetCodesRepository.js";
import { PasswordResetCodeGenerator } from "~/api/domain/crypto/PasswordResetCodeGenerator.js";
import { PasswordResetMailer } from "~/api/domain/mail/PasswordResetMailer.js";

export const SEND_PASSWORD_RESET_CODE_TASK = "selfHostedAuthSendPasswordResetCode";

export interface SendPasswordResetCodeInput {
    /** The request row the code is stored on. */
    codeId: string;
    /** The address as the user typed it. `CredentialsRepository` normalizes it for the lookup. */
    email: string;
}

/**
 * Mails a reset code, off the request.
 *
 * Everything that differs between an address with an account and one without happens here: the
 * credential lookup, generating and hashing the code, and the SMTP send. The request only writes a
 * row and triggers this task, which costs the same for every address, so how long the request takes
 * says nothing about the account.
 *
 * The code is generated here, not passed in. Task input is stored in the tasks table as it is,
 * and the code must only ever exist as a hash and in the email.
 */
class SendPasswordResetCodeTaskHandlerImpl implements TaskHandler.Interface<SendPasswordResetCodeInput> {
    constructor(
        private credentials: CredentialsRepository.Interface,
        private codes: PasswordResetCodesRepository.Interface,
        private generator: PasswordResetCodeGenerator.Interface,
        private hasher: Hasher.Interface,
        private mailer: PasswordResetMailer.Interface,
        private logger: Logger.Interface
    ) {}

    async run({ input, controller }: TaskHandler.RunParams<SendPasswordResetCodeInput>) {
        const found = await this.credentials.getByEmail({ email: input.email });
        if (found.isFail()) {
            this.logger.error(
                { codeId: input.codeId },
                "Could not look up a password reset account."
            );
            return controller.response.error({ message: found.error.message });
        }

        const credential = found.value;
        if (!credential) {
            // The ordinary outcome of a reset requested for an address that was never registered.
            // The row stays without a code and expires on its own.
            return controller.response.done();
        }

        const code = this.generator.generate();
        const codeHash = await this.hasher.hash(code);

        const stored = await this.codes.setCodeHash({ id: input.codeId, codeHash });
        if (stored.isFail()) {
            this.logger.error({ codeId: input.codeId }, "Could not store a password reset code.");
            return controller.response.error({ message: stored.error.message });
        }

        if (!stored.value) {
            // The row is gone or already has a code, so this is a repeat run. Mailing a code that
            // was not stored would send the user one that cannot work.
            return controller.response.done();
        }

        const sent = await this.mailer.send({ email: credential.email, code });
        if (!sent) {
            this.logger.error(
                { email: credential.email },
                "Could not deliver a password reset code."
            );
            return controller.response.error({
                message: "Could not deliver a password reset code."
            });
        }

        return controller.response.done();
    }
}

const SendPasswordResetCodeTaskHandler = TaskHandler.createImplementation({
    implementation: SendPasswordResetCodeTaskHandlerImpl,
    dependencies: [
        CredentialsRepository,
        PasswordResetCodesRepository,
        PasswordResetCodeGenerator,
        Hasher,
        PasswordResetMailer,
        Logger
    ]
});

class SendPasswordResetCodeTask implements TaskDefinition.Interface<SendPasswordResetCodeInput> {
    id = SEND_PASSWORD_RESET_CODE_TASK;
    title = "Send password reset code";
    description = "Emails a password reset code to an address that has an account.";
    // One attempt. A retry would mail a second code, and the user can ask for another.
    maxIterations = 1;
    isPrivate = true;
    databaseLogs = false;
    // The input holds the address a reset was asked for. Nothing needs it once the task is over.
    selfCleanup = "always" as const;

    handler = SendPasswordResetCodeTaskHandler;
}

export const SendPasswordResetCodeTaskDefinition = TaskDefinition.createImplementation({
    implementation: SendPasswordResetCodeTask,
    dependencies: []
});
