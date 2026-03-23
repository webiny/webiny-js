import { Result } from "@webiny/feature/api";
import { RestoreEntryFromBinUseCase } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin";
import { RestorePageRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";
import { GetRevisionsByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionsByEntryId/index.js";

class RestorePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private restoreEntry: RestoreEntryFromBinUseCase.Interface,
        private getRevisionsById: GetRevisionsByEntryIdUseCase.Interface,
        private pageModel: PageModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        // First, validate the page exists
        const getResult = await this.getRevisionsById.execute(this.pageModel, params.id);

        if (getResult.isFail()) {
            return Result.fail(new PagePersistenceError(getResult.error));
        }
        const page = getResult.value[0];
        if (!page) {
            return Result.fail(new PageNotFoundError(params.id));
        }

        // Restore the entry
        const result = await this.restoreEntry.execute(this.pageModel, params.id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(result.error));
        }

        return Result.ok();
    }
}

export const RestorePageRepository = RepositoryAbstraction.createImplementation({
    implementation: RestorePageRepositoryImpl,
    dependencies: [RestoreEntryFromBinUseCase, GetRevisionsByEntryIdUseCase, PageModel]
});
