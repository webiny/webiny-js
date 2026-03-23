import { Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { TrashPageRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

class TrashPageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private deleteEntry: DeleteEntryUseCase.Interface,
        private pageModel: PageModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        // Trash the entry
        const result = await this.deleteEntry.execute(this.pageModel, params.id, {
            permanently: false
        });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const TrashPageRepository = RepositoryAbstraction.createImplementation({
    implementation: TrashPageRepositoryImpl,
    dependencies: [DeleteEntryUseCase, PageModel]
});
