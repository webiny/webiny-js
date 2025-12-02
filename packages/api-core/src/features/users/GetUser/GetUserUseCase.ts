import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { GetUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { NotAuthorizedError } from "~/features/users/shared/errors.js";
import type { AdminUser } from "~/features/users/shared/types.js";
import type { GetUserInput } from "~/features/users/shared/types.js";

class GetUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: AdminUsersRepository.Interface
    ) {}

    async execute(input: GetUserInput): Promise<Result<AdminUser, UseCaseAbstraction.Error>> {
        // 1. Check permission
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        // 2. Get user from repository
        const result = await this.repository.get(input);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const GetUserUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetUserUseCaseImpl,
    dependencies: [IdentityContext, AdminUsersRepository]
});
