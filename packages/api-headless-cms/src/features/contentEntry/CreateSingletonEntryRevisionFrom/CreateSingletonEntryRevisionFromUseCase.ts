import { Result } from "@webiny/feature/api";
import { CreateSingletonEntryRevisionFromUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateEntryRevisionFromUseCase } from "~/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { checkSingletonRevision } from "~/features/contentEntry/shared/checkSingletonRevision.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { CreateCmsEntryInput, CreateCmsEntryOptionsInput } from "~/types/index.js";

class CreateSingletonEntryRevisionFromUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private createEntryRevisionFrom: CreateEntryRevisionFromUseCase.Interface) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        revision: string,
        data?: CreateCmsEntryInput<T>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const checkResult = checkSingletonRevision({
            model,
            value: revision,
            operation: "createFrom"
        });
        if (checkResult.isFail()) {
            return Result.fail(checkResult.error);
        }

        // Revision data is optional: an empty input copies the source revision as is.
        const emptyInput = {} as CreateCmsEntryInput<T>;
        const input = data ?? emptyInput;

        return await this.createEntryRevisionFrom.execute<T>(model, revision, input, options);
    }
}

export const CreateSingletonEntryRevisionFromUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateSingletonEntryRevisionFromUseCaseImpl,
    dependencies: [CreateEntryRevisionFromUseCase]
});
