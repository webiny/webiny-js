import { Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { DeleteLayoutRepository as RepositoryAbstraction } from "./abstractions.js";
import { LayoutModelProvider } from "~/domain/layout/abstractions.js";
import { LayoutNotFoundError, LayoutPersistenceError } from "~/domain/layout/errors.js";

class DeleteLayoutRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: LayoutModelProvider.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    async execute(entryId: string): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        // Layouts have no trash: deleting one removes it with all its revisions.
        const result = await this.deleteEntry.execute(model, entryId, { permanently: true });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new LayoutNotFoundError(entryId));
            }
            return Result.fail(new LayoutPersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const DeleteLayoutRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteLayoutRepositoryImpl,
    dependencies: [LayoutModelProvider, DeleteEntryUseCase]
});
