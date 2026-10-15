import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { EntryValidationError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import type {
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryOptionsInput
} from "@webiny/api-headless-cms/types/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";

export interface UpdateEntryFaults {
    /** Makes `UpdateEntryUseCase` throw. */
    throwing: boolean;
    /** Makes `UpdateEntryUseCase` fail with an `EntryValidationError` carrying these items. */
    validationData: Array<{ fieldId: string; parents: string[]; error: unknown }> | null;
}

/** Reset it in `beforeEach`. */
export const updateEntryFaults: UpdateEntryFaults = { throwing: false, validationData: null };

class FailingUpdateEntry implements UpdateEntryUseCase.Interface {
    public constructor(private decoratee: UpdateEntryUseCase.Interface) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        input: UpdateEntryUseCase.Input<T>,
        options?: UpdateCmsEntryOptionsInput
    ): UpdateEntryUseCase.Return<T> {
        if (updateEntryFaults.throwing) {
            throw new Error("Storage is down.");
        }
        if (updateEntryFaults.validationData) {
            return Result.fail(
                new EntryValidationError("Validation failed.", updateEntryFaults.validationData)
            );
        }
        return this.decoratee.execute<T>(model, id, input, options);
    }
}

/** Makes `UpdateEntryUseCase` throw or fail validation as `updateEntryFaults` says (`legacyPlugins`). */
export const failUpdateEntry = (container: Container) => {
    container.registerDecorator(
        UpdateEntryUseCase.createDecorator({ decorator: FailingUpdateEntry, dependencies: [] })
    );
};
