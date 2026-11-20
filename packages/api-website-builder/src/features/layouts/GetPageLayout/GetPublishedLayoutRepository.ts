import { Result } from "@webiny/feature/api";
import { GetPublishedRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetPublishedRevisionByEntryId/index.js";
import { GetPublishedLayoutRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbLayout, LayoutModelProvider } from "~/domain/layout/abstractions.js";
import { LayoutPersistenceError } from "~/domain/layout/errors.js";
import { EntryToLayoutMapper } from "~/domain/layout/EntryToLayoutMapper.js";

class GetPublishedLayoutRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: LayoutModelProvider.Interface,
        private getPublishedRevision: GetPublishedRevisionByEntryIdUseCase.Interface
    ) {}

    async execute(entryId: string): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        const result = await this.getPublishedRevision.execute<CmsEntryWbLayout>(model, entryId);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.ok(null);
            }
            return Result.fail(new LayoutPersistenceError(result.error));
        }

        return Result.ok(result.value ? EntryToLayoutMapper.toLayout(result.value) : null);
    }
}

export const GetPublishedLayoutRepository = RepositoryAbstraction.createImplementation({
    implementation: GetPublishedLayoutRepositoryImpl,
    dependencies: [LayoutModelProvider, GetPublishedRevisionByEntryIdUseCase]
});
