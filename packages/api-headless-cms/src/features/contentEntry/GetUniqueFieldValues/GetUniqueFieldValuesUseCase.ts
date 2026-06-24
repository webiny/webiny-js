import { createImplementation, Result } from "@webiny/feature/api";
import {
    GetUniqueFieldValuesParams,
    GetUniqueFieldValuesRepository,
    GetUniqueFieldValuesUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { FieldNotSearchableError, InvalidWhereConditionError } from "./errors.js";
import { getSearchableFields } from "~/crud/contentEntry/searchableFields.js";
import type { CmsEntryUniqueValue, CmsModel } from "~/types/index.js";

class GetUniqueFieldValuesUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private repository: GetUniqueFieldValuesRepository.Interface,
        private accessControl: AccessControl.Interface,
        private cmsContext: CmsContext.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(
        model: CmsModel,
        params: GetUniqueFieldValuesParams
    ): Promise<Result<CmsEntryUniqueValue[], UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model });
        if (!canAccess) {
            return Result.fail(
                new EntryNotAuthorizedError(`Not allowed to access "${model.modelId}" entries.`)
            );
        }

        const { where: initialWhere, fieldId } = params;

        const where = {
            ...initialWhere
        };

        // Apply ownership filter if needed
        const canAccessOnlyOwned = await this.accessControl.canAccessOnlyOwnedEntries({ model });
        if (canAccessOnlyOwned) {
            const identity = this.identityContext.getIdentity();
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
            context: this.cmsContext,
            input: []
        });

        if (!searchableFields.includes(`values.${fieldId}`)) {
            return Result.fail(new FieldNotSearchableError(fieldId));
        }

        // Execute repository call
        const result = await this.repository.execute(model, {
            where,
            fieldId
        });
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const GetUniqueFieldValuesUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetUniqueFieldValuesUseCaseImpl,
    dependencies: [GetUniqueFieldValuesRepository, AccessControl, CmsContext, IdentityContext]
});
