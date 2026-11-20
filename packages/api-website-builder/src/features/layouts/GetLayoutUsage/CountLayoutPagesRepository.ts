import { Result } from "@webiny/feature/api";
import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { CountLayoutPagesRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModelProvider } from "~/domain/page/abstractions.js";
import { LayoutPersistenceError } from "~/domain/layout/errors.js";

class CountLayoutPagesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private pageModelProvider: PageModelProvider.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const pageModel = await this.pageModelProvider.get();
        // `properties` is a searchable-json field: OpenSearch filters it by one key per
        // condition, so the language is a second condition rather than a second key.
        const where: CmsEntryListWhere = { values: { properties: { layout: params.layoutId } } };
        if (params.language) {
            where.AND = [{ values: { properties: { language: params.language } } }];
        }

        // The latest revisions, without the pages in the trash.
        const result = await this.listLatestEntries.execute(pageModel, { where, limit: 1 });

        if (result.isFail()) {
            return Result.fail(new LayoutPersistenceError(result.error));
        }

        return Result.ok(result.value.meta.totalCount);
    }
}

export const CountLayoutPagesRepository = RepositoryAbstraction.createImplementation({
    implementation: CountLayoutPagesRepositoryImpl,
    dependencies: [PageModelProvider, ListLatestEntriesUseCase]
});
