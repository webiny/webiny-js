import { Result } from "@webiny/feature/api";
import { DeleteEntryRevisionUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision";
import { DeleteLayoutRevisionRepository as RepositoryAbstraction } from "./abstractions.js";
import { LayoutModelProvider } from "~/domain/layout/abstractions.js";
import { LayoutNotFoundError, LayoutPersistenceError } from "~/domain/layout/errors.js";

class DeleteLayoutRevisionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: LayoutModelProvider.Interface,
        private deleteEntryRevision: DeleteEntryRevisionUseCase.Interface
    ) {}

    async execute(id: string): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        // Deleting the latest revision promotes the previous one: the CMS use case handles it.
        const result = await this.deleteEntryRevision.execute(model, id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new LayoutNotFoundError(id));
            }
            return Result.fail(new LayoutPersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const DeleteLayoutRevisionRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteLayoutRevisionRepositoryImpl,
    dependencies: [LayoutModelProvider, DeleteEntryRevisionUseCase]
});
