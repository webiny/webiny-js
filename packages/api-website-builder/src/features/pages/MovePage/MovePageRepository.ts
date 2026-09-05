import { Result } from "@webiny/feature/api";
import { MovePageRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModelProvider, type WbPage } from "~/domain/page/abstractions.js";
import { PagePersistenceError } from "~/domain/page/errors.js";
import { MoveEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { GetPageByIdRepository } from "~/features/pages/GetPageById/abstractions.js";

class MovePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private moveEntry: MoveEntryRepository.Interface,
        private getPageById: GetPageByIdRepository.Interface,
        private pageModelProvider: PageModelProvider.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const pageModel = await this.pageModelProvider.get();
        // First, validate the page exists
        const getResult = await this.getPageById.execute(params.id);

        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        // Update the page location with the new folderId
        const result = await this.moveEntry.execute(pageModel, params.id, params.folderId);

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
    dependencies: [MoveEntryRepository, GetPageByIdRepository, PageModelProvider]
});
