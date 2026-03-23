import { Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { DeletePageRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

class DeletePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private deleteEntry: DeleteEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private pageModel: PageModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        // Delete the entry
        const result = await this.deleteEntry.execute(this.pageModel, params.id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const DeletePageRepository = RepositoryAbstraction.createImplementation({
    implementation: DeletePageRepositoryImpl,
    dependencies: [DeleteEntryUseCase, GetEntryByIdUseCase, PageModel]
});
