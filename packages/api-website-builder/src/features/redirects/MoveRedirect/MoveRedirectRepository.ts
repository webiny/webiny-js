import { Result } from "@webiny/feature/api";
import { MoveRedirectRepository as RepositoryAbstraction } from "./abstractions.js";
import { RedirectModel, type WbRedirect } from "~/domain/redirect/abstractions.js";
import {
    RedirectNotAuthorizedError,
    RedirectNotFoundError,
    RedirectPersistenceError,
    RedirectValidationError
} from "~/domain/redirect/errors.js";
import { MoveEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { GetFolderUseCase } from "@webiny/api-aco/features/folder/GetFolder/index.js";
import { GetRedirectByIdRepository } from "~/features/redirects/GetRedirectById/abstractions.js";
import { validateTargetFolder } from "~/features/folders/validateTargetFolder.js";

const REDIRECT_FOLDER_TYPE = "wb:redirect";

class MoveRedirectRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private redirectModel: RedirectModel.Interface,
        private moveEntry: MoveEntryUseCase.Interface,
        private getRedirectById: GetRedirectByIdRepository.Interface,
        private getFolder?: GetFolderUseCase.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        // First, validate the redirect exists
        const getResult = await this.getRedirectById.execute(params.id);

        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        // Security: the target must be an existing, accessible redirect folder.
        const folderProblem = await validateTargetFolder(
            this.getFolder,
            params.folderId,
            REDIRECT_FOLDER_TYPE
        );
        if (folderProblem === "notAuthorized") {
            return Result.fail(new RedirectNotAuthorizedError());
        } else if (folderProblem) {
            return Result.fail(
                new RedirectValidationError(
                    `Folder "${params.folderId}" is not a valid redirect folder.`
                )
            );
        }

        // Security: go through the use case (not the raw repository) so that
        // access control and folder level permissions are applied.
        const result = await this.moveEntry.execute(this.redirectModel, params.id, params.folderId);

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotAuthorized") {
                return Result.fail(new RedirectNotAuthorizedError());
            }
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new RedirectNotFoundError(params.id));
            }
            return Result.fail(new RedirectPersistenceError(result.error));
        }

        const movedRedirect: WbRedirect = {
            ...getResult.value,
            location: {
                folderId: params.folderId
            }
        };
        return Result.ok(movedRedirect);
    }
}

export const MoveRedirectRepository = RepositoryAbstraction.createImplementation({
    implementation: MoveRedirectRepositoryImpl,
    dependencies: [
        RedirectModel,
        MoveEntryUseCase,
        GetRedirectByIdRepository,
        [GetFolderUseCase, { optional: true }]
    ]
});
