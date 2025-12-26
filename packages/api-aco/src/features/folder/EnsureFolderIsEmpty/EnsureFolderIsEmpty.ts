import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ListFoldersUseCase } from "~/features/folder/ListFolders/index.js";
import { EnsureFolderIsEmpty as Abstraction } from "~/features/folder/EnsureFolderIsEmpty/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FolderNotAuthorizedError, FolderNotEmptyError } from "~/domain/folder/errors.js";
import { Result } from "@webiny/feature/api";

class EnsureFolderIsEmptyImpl implements Abstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private listFoldersUseCase: ListFoldersUseCase.Interface
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

        // Let's also check if there are folders / content that are not visible because of folder permissions.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            // If folder level permissions are not enabled, we can skip this check. This is because
            // in that case, all folders and content are visible to the user.
            return Result.ok();
        }

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
    dependencies: [IdentityContext, FolderLevelPermissions, ListFoldersUseCase]
});
