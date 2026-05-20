import { createImplementation, Result } from "@webiny/feature/api";
import {
    type IValidateEntryUserCaseExecuteResult,
    ValidateEntryUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import type { CmsEntryValues, CmsModel, UpdateCmsEntryInput } from "~/types/index.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { mapAndCleanUpdatedInputData } from "~/features/contentEntry/entryDataFactories/mapAndCleanUpdatedInputData.js";
import { validateModelEntryData } from "~/crud/contentEntry/entryDataValidation.js";

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
    public constructor(
        private accessControl: AccessControl.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string | null,
        inputData: UpdateCmsEntryInput<T>
    ): Promise<Result<IValidateEntryUserCaseExecuteResult[], UseCaseAbstraction.Error>> {
        // Check access control
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        // Map and clean input data
        const input = mapAndCleanUpdatedInputData<T>(model, inputData.values || ({} as T));

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
                return Result.fail(EntryNotAuthorizedError.fromModel(model));
            }
        }

        // Validate the data
        const validationResult = await validateModelEntryData({
            context: this.cmsContext,
            model,
            values: input,
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
