import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { GetLatestPageByPathRepository as RepositoryAbstraction } from "./abstractions.js";
import type { CmsEntryWbPage } from "~/domain/page/abstractions.js";
import { PageModelProvider } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PageNotFoundError } from "~/domain/page/errors.js";
import { PagePersistenceError } from "~/domain/page/errors.js";

class GetLatestPageByPathRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pageModelProvider: PageModelProvider.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface
    ) {}

    async execute(path: string): RepositoryAbstraction.Return {
        const pageModel = await this.pageModelProvider.get();
        // Latest revisions only, deleted (trashed) entries excluded, whatever the status.
        const result = await this.listLatestEntries.execute<CmsEntryWbPage>(pageModel, {
            where: {
                values: {
                    properties: {
                        path
                    }
                }
            },
            limit: 1
        });

        if (result.isFail()) {
            return Result.fail(new PagePersistenceError(result.error));
        }

        const entry = result.value.entries[0];
        if (!entry) {
            return Result.fail(new PageNotFoundError(path));
        }

        const page = EntryToPageMapper.toPage(entry);
        return Result.ok(page);
    }
}

export const GetLatestPageByPathRepository = RepositoryAbstraction.createImplementation({
    implementation: GetLatestPageByPathRepositoryImpl,
    dependencies: [PageModelProvider, ListLatestEntriesUseCase]
});
