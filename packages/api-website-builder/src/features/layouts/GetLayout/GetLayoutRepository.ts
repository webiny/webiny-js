import { Result } from "@webiny/feature/api";
import { GetLatestRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { GetPublishedRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetPublishedRevisionByEntryId/index.js";
import { GetLayoutRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbLayout, LayoutModelProvider } from "~/domain/layout/abstractions.js";
import { LayoutNotFoundError, LayoutPersistenceError } from "~/domain/layout/errors.js";
import { EntryToLayoutMapper } from "~/domain/layout/EntryToLayoutMapper.js";
import { LayoutEntryId } from "~/domain/layout/LayoutEntryId.js";

class GetLayoutRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: LayoutModelProvider.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private getPublishedRevision: GetPublishedRevisionByEntryIdUseCase.Interface
    ) {}

    async execute(id: string): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        const result = LayoutEntryId.isRevisionId(id)
            ? await this.getEntryById.execute<CmsEntryWbLayout>(model, id)
            : await this.getLatestRevision.execute<CmsEntryWbLayout>(model, { id });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new LayoutNotFoundError(id));
            }
            return Result.fail(new LayoutPersistenceError(result.error));
        }

        const layout = EntryToLayoutMapper.toLayout(result.value);
        if (layout.status === "published") {
            return Result.ok({ ...layout, live: { version: layout.version } });
        }

        // A revision tells whether, and which, revision of its layout is published.
        const published = await this.getPublishedRevision.execute(model, layout.entryId);
        if (published.isFail()) {
            if (published.error.code === "Cms/Entry/NotFound") {
                return Result.ok({ ...layout, live: null });
            }
            return Result.fail(new LayoutPersistenceError(published.error));
        }

        return Result.ok({
            ...layout,
            live: published.value ? { version: published.value.version } : null
        });
    }
}

export const GetLayoutRepository = RepositoryAbstraction.createImplementation({
    implementation: GetLayoutRepositoryImpl,
    dependencies: [
        LayoutModelProvider,
        GetLatestRevisionByEntryIdUseCase,
        GetEntryByIdUseCase,
        GetPublishedRevisionByEntryIdUseCase
    ]
});
