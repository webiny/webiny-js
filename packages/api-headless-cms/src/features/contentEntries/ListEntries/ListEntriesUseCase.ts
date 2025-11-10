import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { ListEntriesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListEntriesRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type {
    CmsEntry,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsEntryValues,
    CmsModel
} from "~/types/index.js";
import { NotAuthorizedError } from "~/utils/errors.js";

/**
 * ListEntriesUseCase - Base use case for orchestrating entry listing with access control.
 *
 * Responsibilities:
 * - Apply access control
 * - Filter by owner if user can only access own entries
 * - Delegate to repository for data fetching
 */
class ListEntriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: ListEntriesRepository.Interface,
        private accessControl: AccessControl.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): Promise<Result<[CmsEntry<T>[], CmsEntryMeta], UseCaseAbstraction.Error>> {
        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model });
        if (!canAccess) {
            return Result.fail(new NotAuthorizedError());
        }

        const { where: initialWhere, ...rest } = params || {};
        const where = { ...initialWhere };

        // Possibly only get records which are owned by current user
        if (await this.accessControl.canAccessOnlyOwnedEntries({ model })) {
            where.createdBy = this.identityContext.getIdentity().id;
        }

        // Delegate to repository
        const result = await this.repository.execute<T>(model, {
            ...rest,
            where
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const ListEntriesUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListEntriesUseCaseImpl,
    dependencies: [ListEntriesRepository, AccessControl, IdentityContext]
});
