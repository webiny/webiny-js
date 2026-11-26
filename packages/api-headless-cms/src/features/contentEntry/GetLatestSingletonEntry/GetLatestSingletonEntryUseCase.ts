import { Result } from "@webiny/feature/api";
import { GetLatestSingletonEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { createSingletonEntryId } from "~/domain/contentModel/createSingletonEntryId.js";
import { isPublishingEnabled } from "~/domain/contentModel/isPublishingEnabled.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

type GetResult<T extends CmsEntryValues> = Result<
    CmsEntry<T>,
    GetLatestRevisionByEntryIdUseCase.Error | GetRevisionByIdUseCase.Error
>;

/**
 * Tagged models return the latest revision. Untagged models always return `#0001`, so a
 * revision left in storage after the tag was removed is never returned.
 * The entry is created when it does not exist yet.
 */
class GetLatestSingletonEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private getLatestRevisionByEntryId: GetLatestRevisionByEntryIdUseCase.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const entryId = createSingletonEntryId(model);

        let getResult: GetResult<T>;
        if (isPublishingEnabled(model)) {
            getResult = await this.getLatestRevisionByEntryId.execute<T>(model, { id: entryId });
        } else {
            getResult = await this.getRevisionById.execute<T>(model, `${entryId}#0001`);
        }

        if (getResult.isOk()) {
            return Result.ok(getResult.value);
        }

        if (!(getResult.error instanceof EntryNotFoundError)) {
            return Result.fail(getResult.error);
        }

        return await this.createEntry.execute<T>(
            model,
            { id: entryId, values: {} as T },
            { skipValidation: true }
        );
    }
}

export const GetLatestSingletonEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLatestSingletonEntryUseCaseImpl,
    dependencies: [GetLatestRevisionByEntryIdUseCase, GetRevisionByIdUseCase, CreateEntryUseCase]
});
