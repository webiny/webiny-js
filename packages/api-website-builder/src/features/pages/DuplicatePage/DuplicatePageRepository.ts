import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import {
    DuplicatePageRepository as RepositoryAbstraction,
    type DuplicatePageCallback
} from "./abstractions.js";
import { PageModelProvider } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { createDuplicatePageData } from "./createDuplicatePageData.js";
import {
    PageNotFoundError,
    PagePersistenceError,
    PageValidationError
} from "~/domain/page/errors.js";

class DuplicatePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private pageModelProvider: PageModelProvider.Interface
    ) {}

    async execute(
        params: RepositoryAbstraction.Params,
        callback?: DuplicatePageCallback
    ): RepositoryAbstraction.Return {
        const pageModel = await this.pageModelProvider.get();
        // First, get the page to duplicate
        const getResult = await this.getEntryById.execute(pageModel, params.id);

        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(getResult.error));
        }

        const originalPage = EntryToPageMapper.toPage(getResult.value);

        const newPageData = createDuplicatePageData(originalPage);

        // Allow callers to mutate page data before creation
        if (callback) {
            await callback({ original: originalPage, duplicate: newPageData });
        }

        // Create the duplicated page
        const result = await this.createEntry.execute(pageModel, {
            location: newPageData.location,
            values: newPageData
        });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new PageValidationError(result.error.message));
            }
            return Result.fail(new PagePersistenceError(result.error));
        }

        const page = EntryToPageMapper.toPage(result.value);
        return Result.ok(page);
    }
}

export const DuplicatePageRepository = RepositoryAbstraction.createImplementation({
    implementation: DuplicatePageRepositoryImpl,
    dependencies: [CreateEntryUseCase, GetEntryByIdUseCase, PageModelProvider]
});
