import { Result } from "@webiny/feature/api";
import { DeleteEntryRevisionUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision";
import { DeletePageRevisionRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModelProvider } from "~/domain/page/abstractions.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

class DeletePageRevisionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private deleteEntryRevision: DeleteEntryRevisionUseCase.Interface,
        private pageModelProvider: PageModelProvider.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const pageModel = await this.pageModelProvider.get();
        // The CMS use case holds the semantics: the latest revision hands over to the previous
        // one, and the only revision deletes the entry (R236).
        const result = await this.deleteEntryRevision.execute(pageModel, params.id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const DeletePageRevisionRepository = RepositoryAbstraction.createImplementation({
    implementation: DeletePageRevisionRepositoryImpl,
    dependencies: [DeleteEntryRevisionUseCase, PageModelProvider]
});
