import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import {
    CreatePageRepository as RepositoryAbstraction,
    type ICreatePageRepository
} from "./abstractions.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PagePersistenceError, PageValidationError } from "~/domain/page/errors.js";

class CreatePageRepositoryImpl implements ICreatePageRepository {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private pageModel: PageModel.Interface
    ) {}

    async execute(data: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        // Create the entry using CMS CreateEntry use case
        const result = await this.createEntry.execute(this.pageModel, {
            location: data.location,
            values: data
        });

        if (result.isFail()) {
            // Map CMS errors to domain errors
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new PageValidationError(result.error.message));
            }
            return Result.fail(new PagePersistenceError(result.error));
        }

        // Map CmsEntry to WbPage domain type
        const page = EntryToPageMapper.toPage(result.value);
        return Result.ok(page);
    }
}

export const CreatePageRepository = RepositoryAbstraction.createImplementation({
    implementation: CreatePageRepositoryImpl,
    dependencies: [CreateEntryUseCase, PageModel]
});
