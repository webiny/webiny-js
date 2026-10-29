import { Result } from "@webiny/feature/api";
import { DeleteEntryRevisionUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision";
import { DeletePageRevisionRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

class DeletePageRevisionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private deleteEntryRevision: DeleteEntryRevisionUseCase.Interface,
        private pageModel: PageModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        /**
         * Deleting the latest revision, or the last remaining one, is handled by the CMS use case:
         * it promotes the previous revision, or deletes the whole entry when none is left.
         */
        const result = await this.deleteEntryRevision.execute(this.pageModel, params.id);

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
    dependencies: [DeleteEntryRevisionUseCase, PageModel]
});
