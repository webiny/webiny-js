import { Result } from "@webiny/feature/api";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UpdateAdminUserUseCase } from "~/api/features/UpdateAdminUser/index.js";
import { UpdateCurrentAdminUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { UpdateCurrentAdminUserInput } from "./abstractions.js";

class UpdateCurrentAdminUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private updateUser: UpdateAdminUserUseCase.Interface
    ) {}

    async execute(
        input: UpdateCurrentAdminUserInput
    ): Promise<Result<AdminUser, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (!identity.isAdmin()) {
            return Result.fail(new NotAuthorizedError());
        }

        /*
         * Changing your own account does not take `adminUsers` permissions, so the update runs
         * without them. The input type is what keeps roles and teams out of reach.
         */
        return this.identityContext.withoutAuthorization(() => {
            return this.updateUser.execute(identity.id, input);
        });
    }
}

export const UpdateCurrentAdminUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateCurrentAdminUserUseCaseImpl,
    dependencies: [IdentityContext, UpdateAdminUserUseCase]
});
