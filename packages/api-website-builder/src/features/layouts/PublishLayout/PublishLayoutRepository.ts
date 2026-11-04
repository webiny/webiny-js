import { Result } from "@webiny/feature/api";
import { PublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry";
import { PublishLayoutRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbLayout, LayoutModelProvider } from "~/domain/layout/abstractions.js";
import { LayoutNotFoundError, LayoutPersistenceError } from "~/domain/layout/errors.js";
import { EntryToLayoutMapper } from "~/domain/layout/EntryToLayoutMapper.js";

class PublishLayoutRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: LayoutModelProvider.Interface,
        private publishEntry: PublishEntryUseCase.Interface
    ) {}

    async execute(id: string): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        const result = await this.publishEntry.execute<CmsEntryWbLayout>(model, id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new LayoutNotFoundError(id));
            }
            return Result.fail(new LayoutPersistenceError(result.error));
        }

        return Result.ok(EntryToLayoutMapper.toLayout(result.value));
    }
}

export const PublishLayoutRepository = RepositoryAbstraction.createImplementation({
    implementation: PublishLayoutRepositoryImpl,
    dependencies: [LayoutModelProvider, PublishEntryUseCase]
});
