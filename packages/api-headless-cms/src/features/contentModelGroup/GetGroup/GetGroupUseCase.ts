import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { GetGroupUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetGroupRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type { CmsGroup } from "~/types/index.js";
import { GroupNotAuthorizedError } from "~/domain/contentModelGroup/errors.js";

/**
 * GetGroupUseCase - Retrieves a single content model group by ID.
 *
 * Responsibilities:
 * - Apply initial access control check
 * - Delegate to repository (which uses GroupCache for plugin + DB groups)
 * - Return the group or appropriate error
 */
class GetGroupUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: GetGroupRepository.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async execute(groupId: string): Promise<Result<CmsGroup, UseCaseAbstraction.Error>> {
        // Initial access control check (no specific group yet)
        const canAccess = await this.accessControl.canAccessGroup();
        if (!canAccess) {
            return Result.fail(new GroupNotAuthorizedError());
        }

        // Repository uses GroupCache to fetch all groups, then filters by ID
        // GroupCache handles merging plugin + database groups and access control
        const result = await this.repository.execute(groupId);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const GetGroupUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetGroupUseCaseImpl,
    dependencies: [GetGroupRepository, AccessControl]
});
