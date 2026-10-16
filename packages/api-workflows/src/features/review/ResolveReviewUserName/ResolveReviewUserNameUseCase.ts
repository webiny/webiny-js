import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { UserNotFoundError } from "@webiny/api-core/features/users/shared/errors.js";
import type { AdminUser } from "@webiny/api-core/features/users/shared/types.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { ResolveReviewUserNameUseCase as UseCase } from "./abstractions.js";

type GetUserResult = Result<AdminUser, GetUserUseCase.Error>;

class ResolveReviewUserNameUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUser: GetUserUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        // `GetUserUseCase` needs a users permission, which a reviewer does not have. A name lookup
        // is not an access decision, so only this lookup runs without authorization (R251).
        let result: GetUserResult;
        try {
            result = await this.identityContext.withoutAuthorization(() => {
                return this.getUser.execute({ id: input.userId });
            });
        } catch (error) {
            const message = String(error);
            const cause = error instanceof Error ? error : new Error(message);
            this.logger.error(
                { error: cause, userId: input.userId },
                "Could not look up the display name of a skipped user."
            );
            return Result.fail(new ReviewPersistenceError(cause));
        }

        if (result.isOk()) {
            return Result.ok(result.value.displayName);
        }
        // A deleted user has no name; the entry still keeps its `userId`.
        if (result.error instanceof UserNotFoundError) {
            return Result.ok(null);
        }
        this.logger.error(
            { error: result.error, userId: input.userId },
            "Could not look up the display name of a skipped user."
        );
        return Result.fail(new ReviewPersistenceError(result.error));
    }
}

export const ResolveReviewUserNameUseCase = UseCase.createImplementation({
    implementation: ResolveReviewUserNameUseCaseImpl,
    dependencies: [IdentityContext, GetUserUseCase, Logger]
});
