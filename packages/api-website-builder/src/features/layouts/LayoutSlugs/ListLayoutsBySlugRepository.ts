import { Result } from "@webiny/feature/api";
import {
    ListLatestEntriesUseCase,
    ListPublishedEntriesUseCase
} from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { ListLayoutsBySlugRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbLayout, LayoutModelProvider } from "~/domain/layout/abstractions.js";
import { LayoutPersistenceError } from "~/domain/layout/errors.js";
import { EntryToLayoutMapper } from "~/domain/layout/EntryToLayoutMapper.js";

class ListLayoutsBySlugRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: LayoutModelProvider.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private listPublishedEntries: ListPublishedEntriesUseCase.Interface
    ) {}

    async execute(slug: string): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        const params = { where: { values: { properties: { slug } } }, limit: 100 };
        const [latest, published] = await Promise.all([
            this.listLatestEntries.execute<CmsEntryWbLayout>(model, params),
            this.listPublishedEntries.execute<CmsEntryWbLayout>(model, params)
        ]);

        if (latest.isFail()) {
            return Result.fail(new LayoutPersistenceError(latest.error));
        }
        if (published.isFail()) {
            return Result.fail(new LayoutPersistenceError(published.error));
        }

        return Result.ok(
            [...latest.value.entries, ...published.value.entries].map(entry =>
                EntryToLayoutMapper.toLayout(entry)
            )
        );
    }
}

export const ListLayoutsBySlugRepository = RepositoryAbstraction.createImplementation({
    implementation: ListLayoutsBySlugRepositoryImpl,
    dependencies: [LayoutModelProvider, ListLatestEntriesUseCase, ListPublishedEntriesUseCase]
});
