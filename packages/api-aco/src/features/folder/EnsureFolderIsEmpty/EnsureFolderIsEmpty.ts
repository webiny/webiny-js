import { ListFoldersUseCase } from "~/features/folder/ListFolders/index.js";
import { EnsureFolderIsEmpty as Abstraction } from "~/features/folder/EnsureFolderIsEmpty/abstractions.js";
import { Logger } from "@webiny/api-core/exports/api/logger.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FolderNotAuthorizedError, FolderNotEmptyError } from "~/domain/folder/errors.js";
import { Result } from "@webiny/feature/api";

class EnsureFolderIsEmptyImpl implements Abstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private listFoldersUseCase: ListFoldersUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(
        type: string,
        id: string,
        hasContentCallback: Abstraction.HasContentCallback
    ): Abstraction.Return {
        const hasFoldersCallback = async () => {
            const result = await this.listFoldersUseCase.execute({
                where: {
                    type,
                    parentId: id
                },
                limit: 1
            });
            if (result.isFail()) {
                this.logger.error(result.error);
                // Report the folder as non-empty so a failed lookup cannot green-light a delete.
                return true;
            }

            const { folders } = result.value;

            return folders.length > 0;
        };

        const [hasFolders, hasContent] = await Promise.all([
            hasFoldersCallback(),
            hasContentCallback()
        ]);

        if (hasFolders || hasContent) {
            return Result.fail(new FolderNotEmptyError());
        }

        /* Also check for folders / content the identity cannot see. Security: run this even when
           folder level permissions are not used, because other restrictions (e.g. "own entries
           only") also hide content, and the folder must not be deleted from under it. */
        const [hasInvisibleFolders, hasInvisibleContent] =
            await this.identityContext.withoutAuthorization(async () => {
                const [hasFolders, hasContent] = await Promise.all([
                    hasFoldersCallback(),
                    hasContentCallback()
                ]);
                return [hasFolders, hasContent];
            });

        // In case there are invisible folders or content, we'll throw a different error.
        // This is to prevent users from deleting folders that contain content they can't see.
        if (hasInvisibleFolders || hasInvisibleContent) {
            return Result.fail(new FolderNotAuthorizedError());
        }

        return Result.ok();
    }
}

export const EnsureFolderIsEmpty = Abstraction.createImplementation({
    implementation: EnsureFolderIsEmptyImpl,
    dependencies: [IdentityContext, ListFoldersUseCase, Logger]
});
