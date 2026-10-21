import { Result } from "@webiny/feature/api";
import {
    ListLatestEntriesUseCase,
    ListPublishedEntriesUseCase
} from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { ListLayoutsRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbLayout, LayoutModelProvider } from "~/domain/layout/abstractions.js";
import { LayoutPersistenceError } from "~/domain/layout/errors.js";
import { EntryToLayoutMapper } from "~/domain/layout/EntryToLayoutMapper.js";

class ListLayoutsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: LayoutModelProvider.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private listPublishedEntries: ListPublishedEntriesUseCase.Interface
    ) {}

    async execute(where: RepositoryAbstraction.Where = {}): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        // A site has a handful of layouts.
        const params = {
            limit: 10000,
            where: where.createdBy ? { createdBy: where.createdBy } : {}
        };
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

        // The latest revision tells whether, and which, revision is published.
        const publishedVersions = new Map(
            published.value.entries.map(entry => [entry.entryId, entry.version])
        );

        return Result.ok(
            latest.value.entries.map(entry => {
                const layout = EntryToLayoutMapper.toLayout(entry);
                const version = publishedVersions.get(entry.entryId);
                return { ...layout, live: version ? { version } : null };
            })
        );
    }
}

export const ListLayoutsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListLayoutsRepositoryImpl,
    dependencies: [LayoutModelProvider, ListLatestEntriesUseCase, ListPublishedEntriesUseCase]
});
