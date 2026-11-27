import { Result } from "@webiny/feature/api";
import { GetLatestSingletonEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import {
    EntryAlreadyExistsError,
    EntryNotFoundError,
    EntryValidationError
} from "~/domain/contentEntry/errors.js";
import { isSingletonModel } from "~/domain/contentModel/isSingletonModel.js";
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
        if (!isSingletonModel(model)) {
            return Result.fail(new EntryValidationError("Model is not marked as singleton."));
        }

        const entryId = createSingletonEntryId(model);

        // A concurrent request can create the entry between our read and our create. In that case
        // the create fails as already existing, and a second round reads the entry that won.
        for (let attempt = 0; attempt < 2; attempt++) {
            let getResult: GetResult<T>;
            if (isPublishingEnabled(model)) {
                getResult = await this.getLatestRevisionByEntryId.execute<T>(model, {
                    id: entryId
                });
            } else {
                getResult = await this.getRevisionById.execute<T>(model, `${entryId}#0001`);
            }

            if (getResult.isOk()) {
                return Result.ok(getResult.value);
            }

            if (!(getResult.error instanceof EntryNotFoundError)) {
                return Result.fail(getResult.error);
            }

            const createResult = await this.createEntry.execute<T>(
                model,
                { id: entryId, values: {} as T },
                { skipValidation: true }
            );

            if (createResult.isOk() || !(createResult.error instanceof EntryAlreadyExistsError)) {
                return createResult;
            }
        }

        return Result.fail(new EntryNotFoundError(entryId));
    }
}

export const GetLatestSingletonEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLatestSingletonEntryUseCaseImpl,
    dependencies: [GetLatestRevisionByEntryIdUseCase, GetRevisionByIdUseCase, CreateEntryUseCase]
});
