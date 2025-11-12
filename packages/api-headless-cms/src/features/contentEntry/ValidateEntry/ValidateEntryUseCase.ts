import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { ValidateEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import type { CmsModel, CmsModelFieldValidation } from "~/types/index.js";
import { NotAuthorizedError } from "~/utils/errors.js";
import { mapAndCleanUpdatedInputData } from "~/crud/contentEntry/entryDataFactories/index.js";
import { validateModelEntryData } from "~/crud/contentEntry/entryDataValidation.js";
import { CmsContext } from "~/features/shared/abstractions.js";

/**
 * ValidateEntryUseCase - Orchestrates entry data validation.
 *
 * Responsibilities:
 * - Apply access control
 * - Optionally get the entry being validated (if id provided)
 * - Map and clean input data
 * - Validate data against model field validators
 * - Return validation results
 */
class ValidateEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private accessControl: AccessControl.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    async execute(
        model: CmsModel,
        id: string | null,
        inputData: Record<string, any>
    ): Promise<Result<CmsModelFieldValidation[], UseCaseAbstraction.Error>> {
        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(NotAuthorizedError.fromModel(model));
        }

        // Map and clean input data
        const input = mapAndCleanUpdatedInputData(model, inputData || {});

        // Optionally get the entry being validated
        let originalEntry = undefined;
        if (id) {
            const entryResult = await this.getRevisionById.execute(model, id);

            if (entryResult.isFail()) {
                return Result.fail(entryResult.error);
            }

            originalEntry = entryResult.value;

            // Check access control on the specific entry
            const canAccessEntry = await this.accessControl.canAccessEntry({
                model,
                entry: originalEntry,
                rwd: "w"
            });

            if (!canAccessEntry) {
                return Result.fail(NotAuthorizedError.fromModel(model));
            }
        }

        // Validate the data
        const validationResult = await validateModelEntryData({
            context: this.cmsContext,
            model,
            data: input,
            entry: originalEntry
        });

        return Result.ok(validationResult.length > 0 ? validationResult : []);
    }
}

export const ValidateEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ValidateEntryUseCaseImpl,
    dependencies: [AccessControl, GetRevisionByIdUseCase, CmsContext]
});
