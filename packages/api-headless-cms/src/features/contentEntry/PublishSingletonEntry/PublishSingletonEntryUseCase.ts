import { Result } from "@webiny/feature/api";
import { PublishSingletonEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";
import { checkSingletonRevision } from "~/features/contentEntry/shared/checkSingletonRevision.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

class PublishSingletonEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private publishEntry: PublishEntryUseCase.Interface) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        revision: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const checkResult = checkSingletonRevision({
            model,
            value: revision,
            operation: "publish"
        });
        if (checkResult.isFail()) {
            return Result.fail(checkResult.error);
        }

        return await this.publishEntry.execute<T>(model, revision);
    }
}

export const PublishSingletonEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: PublishSingletonEntryUseCaseImpl,
    dependencies: [PublishEntryUseCase]
});
