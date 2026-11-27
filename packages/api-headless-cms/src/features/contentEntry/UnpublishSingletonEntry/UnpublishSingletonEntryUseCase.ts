import { Result } from "@webiny/feature/api";
import { UnpublishSingletonEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/UnpublishEntry/index.js";
import { checkSingletonRevision } from "~/features/contentEntry/shared/checkSingletonRevision.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

class UnpublishSingletonEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private unpublishEntry: UnpublishEntryUseCase.Interface) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        revision: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const checkResult = checkSingletonRevision({
            model,
            value: revision,
            operation: "unpublish"
        });
        if (checkResult.isFail()) {
            return Result.fail(checkResult.error);
        }

        return await this.unpublishEntry.execute<T>(model, revision);
    }
}

export const UnpublishSingletonEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: UnpublishSingletonEntryUseCaseImpl,
    dependencies: [UnpublishEntryUseCase]
});
