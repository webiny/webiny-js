import { Result } from "@webiny/feature/api";
import { GetRevisionsByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionsByEntryId/index.js";
import { GetLayoutRevisionsRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbLayout, LayoutModelProvider } from "~/domain/layout/abstractions.js";
import { EntryToLayoutMapper } from "~/domain/layout/EntryToLayoutMapper.js";
import { LayoutPersistenceError } from "~/domain/layout/errors.js";

class GetLayoutRevisionsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: LayoutModelProvider.Interface,
        private getRevisions: GetRevisionsByEntryIdUseCase.Interface
    ) {}

    async execute(entryId: string): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        const result = await this.getRevisions.execute<CmsEntryWbLayout>(model, entryId);

        if (result.isFail()) {
            return Result.fail(new LayoutPersistenceError(result.error));
        }

        const layouts = result.value
            .map(entry => EntryToLayoutMapper.toLayout(entry))
            .sort((a, b) => b.version - a.version);

        // Every revision tells whether, and which, revision of its layout is published.
        const published = layouts.find(layout => layout.status === "published");
        const live = published ? { version: published.version } : null;

        return Result.ok(layouts.map(layout => ({ ...layout, live })));
    }
}

export const GetLayoutRevisionsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetLayoutRevisionsRepositoryImpl,
    dependencies: [LayoutModelProvider, GetRevisionsByEntryIdUseCase]
});
