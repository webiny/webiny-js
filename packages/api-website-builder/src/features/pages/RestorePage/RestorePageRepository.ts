import { Result } from "@webiny/feature/api";
import { RestoreEntryFromBinUseCase } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin";
import { RestorePageRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";

class RestorePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private restoreEntry: RestoreEntryFromBinUseCase.Interface,
        private pageModel: PageModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        // Restore the entry
        const result = await this.restoreEntry.execute(this.pageModel, params.id);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(result.error));
        }

        const page = EntryToPageMapper.toPage(result.value);
        return Result.ok(page);
    }
}

export const RestorePageRepository = RepositoryAbstraction.createImplementation({
    implementation: RestorePageRepositoryImpl,
    dependencies: [RestoreEntryFromBinUseCase, PageModel]
});
