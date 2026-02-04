import { Result } from "@webiny/feature/api";
import pick from "lodash/pick.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { DuplicatePageRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import {
    PageNotFoundError,
    PagePersistenceError,
    PageValidationError
} from "~/domain/page/errors.js";

class DuplicatePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private pageModel: PageModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        // First, get the page to duplicate
        const getResult = await this.getEntryById.execute(this.pageModel, params.id);

        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(getResult.error));
        }

        const originalPage = EntryToPageMapper.toPage(getResult.value);

        // Pick only the necessary data for duplication
        const dataToDuplicate = pick(originalPage, [
            "bindings",
            "elements",
            "location",
            "properties",
            "metadata",
            "extensions"
        ]);

        // Create new page data with "Copy of" prefix
        const newPageData = {
            ...dataToDuplicate,
            properties: {
                ...dataToDuplicate.properties,
                path: `${originalPage.properties.path}-copy`,
                title: "Copy of " + originalPage.properties.title
            }
        };

        // Create the duplicated page
        const result = await this.createEntry.execute(this.pageModel, {
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
    dependencies: [CreateEntryUseCase, GetEntryByIdUseCase, PageModel]
});
