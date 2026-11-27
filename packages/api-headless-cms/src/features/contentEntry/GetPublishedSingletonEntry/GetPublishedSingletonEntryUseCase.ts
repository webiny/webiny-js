import { Result } from "@webiny/feature/api";
import { GetPublishedSingletonEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetPublishedRevisionByEntryIdUseCase } from "~/features/contentEntry/GetPublishedRevisionByEntryId/index.js";
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

/**
 * Tagged models return the published revision. When nothing is published, `#0001` is returned
 * with empty values. Untagged models always return `#0001`.
 * The entry is created when it does not exist yet.
 */
class GetPublishedSingletonEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private getPublishedRevisionByEntryId: GetPublishedRevisionByEntryIdUseCase.Interface,
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
        const publishingEnabled = isPublishingEnabled(model);

        if (publishingEnabled) {
            const publishedResult = await this.getPublishedRevisionByEntryId.execute<T>(
                model,
                entryId
            );
            if (publishedResult.isOk() && publishedResult.value) {
                return Result.ok(publishedResult.value);
            }
            // Nothing published is not a failure: fall through to #0001.
            if (
                publishedResult.isFail() &&
                !(publishedResult.error instanceof EntryNotFoundError)
            ) {
                return Result.fail(publishedResult.error);
            }
        }

        // A concurrent request can create the entry between our read and our create. In that case
        // the create fails as already existing, and a second round reads the entry that won.
        let first: CmsEntry<T> | undefined;
        for (let attempt = 0; attempt < 2 && !first; attempt++) {
            const firstResult = await this.getRevisionById.execute<T>(model, `${entryId}#0001`);

            if (firstResult.isOk()) {
                first = firstResult.value;
                continue;
            }

            if (!(firstResult.error instanceof EntryNotFoundError)) {
                return Result.fail(firstResult.error);
            }

            const createResult = await this.createEntry.execute<T>(
                model,
                { id: entryId, values: {} as T },
                { skipValidation: true }
            );

            if (createResult.isOk()) {
                first = createResult.value;
            } else if (!(createResult.error instanceof EntryAlreadyExistsError)) {
                return Result.fail(createResult.error);
            }
        }

        if (!first) {
            return Result.fail(new EntryNotFoundError(`${entryId}#0001`));
        }

        if (publishingEnabled) {
            // Nothing is published: the revision is returned without values.
            return Result.ok({ ...first, values: {} as T });
        }

        return Result.ok(first);
    }
}

export const GetPublishedSingletonEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPublishedSingletonEntryUseCaseImpl,
    dependencies: [GetPublishedRevisionByEntryIdUseCase, GetRevisionByIdUseCase, CreateEntryUseCase]
});
