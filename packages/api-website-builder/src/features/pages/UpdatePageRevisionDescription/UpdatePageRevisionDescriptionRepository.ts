import { Result } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { UpdatePageRevisionDescriptionRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import {
    PageNotFoundError,
    PagePersistenceError,
    PageValidationError
} from "~/domain/page/errors.js";
import { UpdateRevisionDescriptionUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateRevisionDescription/index.js";

class UpdatePageRevisionDescriptionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private updateEntryRevisionDescription: UpdateRevisionDescriptionUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private pageModel: PageModel.Interface
    ) {}

    async execute(
        id: string,
        revisionDescription: string | undefined
    ): RepositoryAbstraction.Return {
        // First, validate the page exists
        const getResult = await this.getEntryById.execute(this.pageModel, id);

        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(id));
            }
            return Result.fail(new PagePersistenceError(getResult.error));
        }

        // Update the entry
        const result = await this.updateEntryRevisionDescription.execute(
            this.pageModel,
            id,
            revisionDescription
        );

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new PageValidationError(result.error.message));
            }
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(id));
            }
            return Result.fail(new PagePersistenceError(result.error));
        }

        const page = EntryToPageMapper.toPage(result.value);
        return Result.ok(page);
    }
}

export const UpdatePageRevisionDescriptionRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdatePageRevisionDescriptionRepositoryImpl,
    dependencies: [UpdateRevisionDescriptionUseCase, GetEntryByIdUseCase, PageModel]
});
