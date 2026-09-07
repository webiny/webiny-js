import { Result } from "@webiny/feature/api";
import { UnpublishPageRepository as RepositoryAbstraction } from "./abstractions.js";
import { UnpublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { PageModelProvider } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

class UnpublishPageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private unpublishEntry: UnpublishEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private pageModelProvider: PageModelProvider.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const pageModel = await this.pageModelProvider.get();
        // First, validate the page exists
        const getResult = await this.getEntryById.execute(pageModel, params.id);

        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(getResult.error));
        }

        // Unpublish the entry
        const result = await this.unpublishEntry.execute(pageModel, params.id);

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

export const UnpublishPageRepository = RepositoryAbstraction.createImplementation({
    implementation: UnpublishPageRepositoryImpl,
    dependencies: [UnpublishEntryUseCase, GetEntryByIdUseCase, PageModelProvider]
});
