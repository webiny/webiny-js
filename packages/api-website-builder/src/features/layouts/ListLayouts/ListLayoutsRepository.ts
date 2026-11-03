import { Result } from "@webiny/feature/api";
import {
    ListLatestEntriesUseCase,
    ListPublishedEntriesUseCase
} from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { ListLayoutsRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbLayout, LayoutModelProvider } from "~/domain/layout/abstractions.js";
import { LayoutPersistenceError } from "~/domain/layout/errors.js";
import { EntryToLayoutMapper } from "~/domain/layout/EntryToLayoutMapper.js";
import { listAllEntries } from "~/utils/listAllEntries.js";

class ListLayoutsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: LayoutModelProvider.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private listPublishedEntries: ListPublishedEntriesUseCase.Interface
    ) {}

    async execute(where: RepositoryAbstraction.Where = {}): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        const latest = await listAllEntries(
            params => this.listLatestEntries.execute<CmsEntryWbLayout>(model, params),
            { where: where.createdBy ? { createdBy: where.createdBy } : {} }
        );
        if (latest.isFail()) {
            return Result.fail(new LayoutPersistenceError(latest.error));
        }
        if (latest.value.length === 0) {
            return Result.ok([]);
        }

        // The published revisions of the listed layouts tell whether, and which, revision is live.
        const published = await listAllEntries(
            params => this.listPublishedEntries.execute<CmsEntryWbLayout>(model, params),
            { where: { entryId_in: latest.value.map(entry => entry.entryId) } }
        );
        if (published.isFail()) {
            return Result.fail(new LayoutPersistenceError(published.error));
        }

        const publishedVersions = new Map(
            published.value.map(entry => [entry.entryId, entry.version])
        );

        return Result.ok(
            latest.value.map(entry => {
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
