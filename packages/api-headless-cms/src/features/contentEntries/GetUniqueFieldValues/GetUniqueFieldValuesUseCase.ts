import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import {
    GetUniqueFieldValuesUseCase as UseCaseAbstraction,
    GetUniqueFieldValuesRepository,
    GetUniqueFieldValuesParams
} from "./abstractions.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { NotAuthorizedError } from "~/utils/errors.js";
import { FieldNotSearchableError, InvalidWhereConditionError } from "./errors.js";
import { getSearchableFields } from "~/crud/contentEntry/searchableFields.js";
import type { CmsModel, CmsEntryUniqueValue } from "~/types/index.js";

class GetUniqueFieldValuesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: GetUniqueFieldValuesRepository.Interface,
        private accessControl: AccessControl.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    async execute(
        model: CmsModel,
        params: GetUniqueFieldValuesParams
    ): Promise<Result<CmsEntryUniqueValue[], UseCaseAbstraction.Error>> {
        // Check access control - throws if not authorized
        try {
            await this.accessControl.ensureCanAccessEntry({ model });
        } catch (error) {
            if (error instanceof NotAuthorizedError) {
                return Result.fail(error);
            }
            throw error;
        }

        const { where: initialWhere, fieldId } = params;

        const where = {
            ...initialWhere
        };

        // Apply ownership filter if needed
        const canAccessOnlyOwned = await this.accessControl.canAccessOnlyOwnedEntries({ model });
        if (canAccessOnlyOwned) {
            const identity = this.cmsContext.security.getIdentity();
            where.createdBy = identity.id;
        }

        // Validate where conditions
        if (where.latest && where.published) {
            return Result.fail(
                new InvalidWhereConditionError(
                    "Cannot list entries that are both published and latest.",
                    where
                )
            );
        }

        if (!where.latest && !where.published) {
            return Result.fail(
                new InvalidWhereConditionError(
                    "Cannot list entries if we do not have latest or published defined.",
                    where
                )
            );
        }

        // Verify the field is searchable
        const searchableFields = getSearchableFields({
            fields: model.fields,
            plugins: this.cmsContext.plugins,
            input: []
        });

        if (!searchableFields.includes(fieldId)) {
            return Result.fail(new FieldNotSearchableError(fieldId));
        }

        // Execute repository call
        const result = await this.repository.execute(model, { where, fieldId });
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const GetUniqueFieldValuesUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetUniqueFieldValuesUseCaseImpl,
    dependencies: [GetUniqueFieldValuesRepository, AccessControl, CmsContext]
});
