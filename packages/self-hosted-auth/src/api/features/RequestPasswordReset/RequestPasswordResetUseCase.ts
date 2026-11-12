import { Result } from "@webiny/feature/api";
import { mdbid } from "@webiny/utils";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { RequestPasswordResetUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { RequestPasswordResetInput } from "./abstractions.js";
import { MailerNotConfiguredError } from "~/api/domain/errors.js";
import { PasswordResetTaskError } from "~/api/domain/errors.js";
import { TooManyResetRequestsError } from "~/api/domain/errors.js";
import { PasswordResetCodesRepository } from "~/api/repositories/PasswordResetCodesRepository.js";
import type { StoredPasswordResetCode } from "~/api/storage/passwordResetCodes/index.js";
import { PasswordResetMailer } from "~/api/domain/mail/PasswordResetMailer.js";
import { normalizeEmail } from "~/api/domain/normalizeEmail.js";
import { RESET_CODE_TTL_MINUTES } from "~/api/domain/passwordResetPolicy.js";
import { RESET_REQUESTS_PER_WINDOW } from "~/api/domain/passwordResetPolicy.js";
import { RESET_REQUEST_WINDOW_MINUTES } from "~/api/domain/passwordResetPolicy.js";
import { SEND_PASSWORD_RESET_CODE_TASK } from "~/api/features/SendPasswordResetCode/index.js";
import type { SendPasswordResetCodeInput } from "~/api/features/SendPasswordResetCode/index.js";

class RequestPasswordResetUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private codes: PasswordResetCodesRepository.Interface,
        private mailer: PasswordResetMailer.Interface,
        private taskService: TaskService.Interface,
        private logger: Logger.Interface
    ) {}

    /**
     * Records the request and hands the rest to `SendPasswordResetCodeTask`. Every step here is the
     * same for an address with an account and one without: the account is not looked up until the
     * task runs, so neither the answer nor the time it takes says anything about it.
     */
    async execute(
        input: RequestPasswordResetInput
    ): Promise<Result<true, UseCaseAbstraction.Error>> {
        const email = input.email.trim();
        const key = normalizeEmail(email);

        // Asked first, and asked without reference to the address, so that an installation with no
        // mail answers the same way for every address anyone types in.
        const canSendMail = await this.mailer.isConfigured();
        if (!canSendMail) {
            return Result.fail(new MailerNotConfiguredError());
        }

        const now = new Date();

        const windowStart = new Date(now.getTime() - RESET_REQUEST_WINDOW_MINUTES * 60_000);
        const recentRequests = await this.codes.countRequestsSince({
            email: key,
            since: windowStart.toISOString()
        });

        if (recentRequests.isFail()) {
            return Result.fail(recentRequests.error);
        }

        if (recentRequests.value >= RESET_REQUESTS_PER_WINDOW) {
            return Result.fail(new TooManyResetRequestsError());
        }

        // Written for every address, including addresses with no account. The row is what the
        // request limit counts, so writing it only for real accounts would make the limit itself
        // answer the question the identical responses refuse to answer. The task sets the code hash
        // if there is an account to mail it to.
        const expiresOn = new Date(now.getTime() + RESET_CODE_TTL_MINUTES * 60_000);

        const stored: StoredPasswordResetCode = {
            id: mdbid(),
            email: key,
            codeHash: null,
            createdOn: now.toISOString(),
            expiresOn: expiresOn.toISOString(),
            usedOn: null,
            attempts: 0
        };

        const issued = await this.codes.issue({ code: stored });
        if (issued.isFail()) {
            return Result.fail(issued.error);
        }

        const triggered = await this.taskService.trigger<SendPasswordResetCodeInput>({
            definition: SEND_PASSWORD_RESET_CODE_TASK,
            input: { codeId: stored.id, email }
        });

        if (triggered.isFail()) {
            this.logger.error(
                { error: triggered.error.message },
                "Could not start the task that mails a password reset code."
            );
            return Result.fail(new PasswordResetTaskError());
        }

        return Result.ok(true);
    }
}

export const RequestPasswordResetUseCase = UseCaseAbstraction.createImplementation({
    implementation: RequestPasswordResetUseCaseImpl,
    dependencies: [PasswordResetCodesRepository, PasswordResetMailer, TaskService, Logger]
});
