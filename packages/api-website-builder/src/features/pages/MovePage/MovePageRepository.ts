import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { MovePageRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

class MovePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private updateEntry: UpdateEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private pageModel: PageModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        // First, validate the page exists
        const getResult = await this.getEntryById.execute(this.pageModel, params.id);

        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
            return Result.fail(new PagePersistenceError(getResult.error));
        }

        // Update the page location with the new folderId
        const result = await this.updateEntry.execute(this.pageModel, params.id, {
            location: {
                folderId: params.folderId
            }
        });

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

export const MovePageRepository = RepositoryAbstraction.createImplementation({
    implementation: MovePageRepositoryImpl,
    dependencies: [UpdateEntryUseCase, GetEntryByIdUseCase, PageModel]
});
