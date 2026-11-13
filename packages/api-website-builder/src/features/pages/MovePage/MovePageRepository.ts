import { Result } from "@webiny/feature/api";
import { MovePageRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel, type WbPage } from "~/domain/page/abstractions.js";
import {
    PageNotAuthorizedError,
    PageNotFoundError,
    PagePersistenceError,
    PageValidationError
} from "~/domain/page/errors.js";
import { MoveEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { GetFolderUseCase } from "@webiny/api-aco/features/folder/GetFolder/index.js";
import { GetPageByIdRepository } from "~/features/pages/GetPageById/abstractions.js";
import { validateTargetFolder } from "~/features/folders/validateTargetFolder.js";

const PAGE_FOLDER_TYPE = "wb:page";

class MovePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private moveEntry: MoveEntryUseCase.Interface,
        private getPageById: GetPageByIdRepository.Interface,
        private pageModel: PageModel.Interface,
        private getFolder?: GetFolderUseCase.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        // First, validate the page exists
        const getResult = await this.getPageById.execute(params.id);

        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        // Security: the target must be an existing, accessible page folder.
        const folderProblem = await validateTargetFolder(
            this.getFolder,
            params.folderId,
            PAGE_FOLDER_TYPE
        );
        if (folderProblem === "notAuthorized") {
            return Result.fail(new PageNotAuthorizedError());
        } else if (folderProblem) {
            return Result.fail(
                new PageValidationError(`Folder "${params.folderId}" is not a valid page folder.`)
            );
        }

        // Security: go through the use case (not the raw repository) so that
        // access control and folder level permissions are applied.
        const result = await this.moveEntry.execute(this.pageModel, params.id, params.folderId);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotAuthorized") {
                return Result.fail(new PageNotAuthorizedError());
            }
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.id));
            }
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
    dependencies: [
        MoveEntryUseCase,
        GetPageByIdRepository,
        PageModel,
        [GetFolderUseCase, { optional: true }]
    ]
});
