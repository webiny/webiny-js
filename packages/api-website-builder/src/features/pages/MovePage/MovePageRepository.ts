import { Result } from "@webiny/feature/api";
import { MovePageRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel, type WbPage } from "~/domain/page/abstractions.js";
import { PagePersistenceError } from "~/domain/page/errors.js";
import { MoveEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { GetPageByIdRepository } from "~/features/pages/GetPageById/abstractions.js";

class MovePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private moveEntry: MoveEntryRepository.Interface,
        private getPageById: GetPageByIdRepository.Interface,
        private pageModel: PageModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        // First, validate the page exists
        const getResult = await this.getPageById.execute(params.id);

        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        // Update the page location with the new folderId
        const result = await this.moveEntry.execute(this.pageModel, params.id, params.folderId);

        if (result.isFail()) {
            return Result.fail(new PagePersistenceError(result.error));
        }

        const movedPage: WbPage = {
            ...getResult.value,
            location: {
                folderId: params.folderId
            }
        };

        return Result.ok(movedPage);
    }
}

export const MovePageRepository = RepositoryAbstraction.createImplementation({
    implementation: MovePageRepositoryImpl,
    dependencies: [MoveEntryRepository, GetPageByIdRepository, PageModel]
});
