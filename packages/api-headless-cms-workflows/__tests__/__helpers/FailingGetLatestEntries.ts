import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { CmsEntry, CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { GetLatestEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestEntriesByIds/index.js";
import { EntryPersistenceError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

class FailingGetLatestEntries implements GetLatestEntriesByIdsUseCase.Interface {
    public constructor(private decoratee: GetLatestEntriesByIdsUseCase.Interface) {}

    public async execute<T extends CmsEntryValues>(): Promise<
        Result<CmsEntry<T>[], GetLatestEntriesByIdsUseCase.Error>
    > {
        return Result.fail(new EntryPersistenceError(new Error("Storage is down.")));
    }
}

/** The latest-entries read fails (`legacyPlugins`). */
export const failGetLatestEntries = (container: Container) => {
    container.registerDecorator(
        GetLatestEntriesByIdsUseCase.createDecorator({
            decorator: FailingGetLatestEntries,
            dependencies: []
        })
    );
};
