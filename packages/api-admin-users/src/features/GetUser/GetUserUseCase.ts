import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-security/features/IdentityContext";
import { GetUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AdminUsersRepository } from "~/features/shared/abstractions.js";
import { NotAuthorizedError } from "~/features/shared/errors.js";
import type { AdminUser } from "~/features/shared/types.js";
import type { GetUserInput } from "~/features/shared/types.js";

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
