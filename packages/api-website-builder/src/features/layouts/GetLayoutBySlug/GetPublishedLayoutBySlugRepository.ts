import { Result } from "@webiny/feature/api";
import { ListPublishedEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { GetPublishedLayoutBySlugRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbLayout, LayoutModelProvider } from "~/domain/layout/abstractions.js";
import { LayoutPersistenceError } from "~/domain/layout/errors.js";
import { EntryToLayoutMapper } from "~/domain/layout/EntryToLayoutMapper.js";
import { LayoutLineage } from "~/domain/layout/LayoutLineage.js";

class GetPublishedLayoutBySlugRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: LayoutModelProvider.Interface,
        private listPublishedEntries: ListPublishedEntriesUseCase.Interface
    ) {}

    async execute(slug: string): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        const result = await this.listPublishedEntries.execute<CmsEntryWbLayout>(model, {
            where: { values: { properties: { slug } } },
            limit: 10
        });

        if (result.isFail()) {
            return Result.fail(new LayoutPersistenceError(result.error));
        }

        // Slugs are unique among source layouts; language versions have none.
        const source = result.value.entries
            .map(entry => EntryToLayoutMapper.toLayout(entry))
            .find(layout => LayoutLineage.from(layout).isSource());

        return Result.ok(source ?? null);
    }
}

export const GetPublishedLayoutBySlugRepository = RepositoryAbstraction.createImplementation({
    implementation: GetPublishedLayoutBySlugRepositoryImpl,
    dependencies: [LayoutModelProvider, ListPublishedEntriesUseCase]
});
