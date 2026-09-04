import { Result } from "@webiny/feature/api";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { PageModelProvider, type WbPage } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import {
    PageNotFoundError,
    PagePersistenceError,
    PageValidationError
} from "~/domain/page/errors.js";
import { CreatePageRevisionFromRepository as RepositoryAbstraction } from "./abstractions.js";

class CreatePageRevisionFromRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private createRevisionFrom: CreateEntryRevisionFromUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private pageModelProvider: PageModelProvider.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const pageModel = await this.pageModelProvider.get();
        // First, get the existing page to validate it exists
        const getResult = await this.getEntryById.execute<WbPage>(pageModel, params.id);

        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(getResult.error));
        }

        // Create revision from the existing page
        const result = await this.createRevisionFrom.execute(pageModel, params.id, {
            location: getResult.value.location,
            values: {}
        });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new PageValidationError(result.error.message));
            }
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(result.error));
        }

        // Map CmsEntry to WbPage domain type
        const page = EntryToPageMapper.toPage(result.value);
        return Result.ok(page);
    }
}

export const CreatePageRevisionFromRepository = RepositoryAbstraction.createImplementation({
    implementation: CreatePageRevisionFromRepositoryImpl,
    dependencies: [CreateEntryRevisionFromUseCase, GetEntryByIdUseCase, PageModelProvider]
});
