import { Result } from "@webiny/feature/api";
import { UpdateSingletonEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/UpdateEntry/index.js";
import { checkSingletonRevision } from "~/features/contentEntry/shared/checkSingletonRevision.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";

/**
 * UpdateSingletonEntryUseCase - Updates a revision of the singleton entry.
 *
 * Responsibilities:
 * - Check the revision belongs to the singleton
 * - Delegate to generic UpdateEntry use case with the revision id
 */
class UpdateSingletonEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private updateEntryUseCase: UpdateEntryUseCase.Interface) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        revision: string,
        data: UpdateCmsEntryInput<T>,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const checkResult = checkSingletonRevision({ model, value: revision, operation: "update" });
        if (checkResult.isFail()) {
            return Result.fail(checkResult.error);
        }

        return await this.updateEntryUseCase.execute<T>(model, revision, data, options);
    }
}

export const UpdateSingletonEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateSingletonEntryUseCaseImpl,
    dependencies: [UpdateEntryUseCase]
});
