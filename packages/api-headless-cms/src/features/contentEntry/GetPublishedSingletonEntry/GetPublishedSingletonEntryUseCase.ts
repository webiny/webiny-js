import { Result } from "@webiny/feature/api";
import { GetPublishedSingletonEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetPublishedRevisionByEntryIdUseCase } from "~/features/contentEntry/GetPublishedRevisionByEntryId/index.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
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

        const firstResult = await this.getRevisionById.execute<T>(model, `${entryId}#0001`);

        let first: CmsEntry<T>;
        if (firstResult.isOk()) {
            first = firstResult.value;
        } else if (firstResult.error instanceof EntryNotFoundError) {
            const createResult = await this.createEntry.execute<T>(
                model,
                { id: entryId, values: {} as T },
                { skipValidation: true }
            );
            if (createResult.isFail()) {
                return Result.fail(createResult.error);
            }
            first = createResult.value;
        } else {
            return Result.fail(firstResult.error);
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
