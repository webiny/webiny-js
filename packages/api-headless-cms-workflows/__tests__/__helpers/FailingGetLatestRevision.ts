import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { CmsEntry, CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { EntryPersistenceError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

class FailingGetLatestRevision
    implements GetLatestRevisionByEntryIdIncludingDeletedUseCase.Interface
{
    public constructor(
        private decoratee: GetLatestRevisionByEntryIdIncludingDeletedUseCase.Interface
    ) {}

    public async execute<T extends CmsEntryValues>(): Promise<
        Result<CmsEntry<T>, GetLatestRevisionByEntryIdIncludingDeletedUseCase.Error>
    > {
        return Result.fail(new EntryPersistenceError(new Error("Storage is down.")));
    }
}

/** The deleted-entry lookup (latest revision, including the trash) fails (`legacyPlugins`). */
export const failGetLatestRevision = (container: Container) => {
    container.registerDecorator(
        GetLatestRevisionByEntryIdIncludingDeletedUseCase.createDecorator({
            decorator: FailingGetLatestRevision,
            dependencies: []
        })
    );
};
