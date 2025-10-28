import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { ListUsersUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AdminUsersRepository } from "~/features/shared/abstractions.js";
import { NotAuthorizedError } from "~/features/shared/errors.js";
import type { AdminUser } from "~/features/shared/types.js";
import type { ListUsersInput } from "~/features/shared/types.js";

class ListUsersUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: AdminUsersRepository.Interface
    ) {}

    async execute(input: ListUsersInput = {}): Promise<Result<AdminUser[], UseCaseAbstraction.Error>> {
        // 1. Check permission
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        // 2. List users from repository
        const result = await this.repository.list(input);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const ListUsersUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListUsersUseCaseImpl,
    dependencies: [IdentityContext, AdminUsersRepository]
});
