import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { ListGroupsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListGroupsRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type { CmsGroup } from "~/types/index.js";
import { GroupNotAuthorizedError } from "~/domain/contentModelGroup/errors.js";

/**
 * ListGroupsUseCase - Retrieves all content model groups.
 *
 * Responsibilities:
 * - Apply initial access control check
 * - Delegate to repository (which uses GroupCache for plugin + DB groups)
 * - Return all accessible groups
 */
class ListGroupsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: ListGroupsRepository.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async execute(): Promise<Result<CmsGroup[], UseCaseAbstraction.Error>> {
        // Initial access control check (no specific group yet)
        const canAccess = await this.accessControl.canAccessGroup();
        if (!canAccess) {
            return Result.fail(new GroupNotAuthorizedError());
        }

        // Repository uses GroupCache to fetch all groups
        // GroupCache handles merging plugin + database groups and access control
        const result = await this.repository.execute();

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const ListGroupsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListGroupsUseCaseImpl,
    dependencies: [ListGroupsRepository, AccessControl]
});
