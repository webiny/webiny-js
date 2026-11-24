import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { GetCurrentUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { NotAuthorizedError } from "~/features/users/shared/errors.js";
import type { AdminUser } from "~/features/users/shared/types.js";

class GetCurrentUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: AdminUsersRepository.Interface
    ) {}

    async execute(): Promise<Result<AdminUser, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous() || !identity.isAdmin()) {
            return Result.fail(new NotAuthorizedError());
        }

        /**
         * An admin may always load their own user record. The `adminUsers.user` permission,
         * which allows loading any user, is not required here.
         */
        return this.repository.get({ id: identity.id });
    }
}

export const GetCurrentUserUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetCurrentUserUseCaseImpl,
    dependencies: [IdentityContext, AdminUsersRepository]
});
