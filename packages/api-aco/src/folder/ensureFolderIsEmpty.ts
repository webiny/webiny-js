import WebinyError from "@webiny/error";
import type { AcoContext, Folder } from "~/types.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";
import { ListFoldersUseCase } from "~/features/folders/ListFolders/index.js";

interface EnsureFolderIsEmptyParams {
    context: AcoContext;
    folder: Pick<Folder, "id" | "type">;
    hasContentCallback: () => boolean | Promise<boolean>;
}

export const ensureFolderIsEmpty = async ({
    context,
    folder,
    hasContentCallback
}: EnsureFolderIsEmptyParams) => {
    const flp = context.container.resolve(FolderLevelPermissions);
    const listFolders = context.container.resolve(ListFoldersUseCase);

    const hasFoldersCallback = async () => {
        const { id, type } = folder;
        const result = await listFolders.execute({
            where: {
                type,
                parentId: id
            },
            limit: 1
        });

        const [folders] = result.value;

        return folders.length > 0;
    };

    const [hasFolders, hasContent] = await Promise.all([
        hasFoldersCallback(),
        hasContentCallback()
    ]);

    if (hasFolders || hasContent) {
        throw new WebinyError(
            "Delete all child folders and entries before proceeding.",
            "DELETE_FOLDER_WITH_CHILDREN",
            {
                folder,
                hasFolders,
                hasContent
            }
        );
    }

    // Let's also check if there are folders / content that are not visible because of folder permissions.
    if (!flp.canUseFolderLevelPermissions()) {
        // If folder level permissions are not enabled, we can skip this check. This is because
        // in that case, all folders and content are visible to the user.
        return;
    }

    const [hasInvisibleFolders, hasInvisibleContent] = await context.security.withoutAuthorization(
        async () => {
            const [hasFolders, hasContent] = await Promise.all([
                hasFoldersCallback(),
                hasContentCallback()
            ]);
            return [hasFolders, hasContent];
        }
    );

    // In case there are invisible folders or content, we'll throw a different error.
    // This is to prevent users from deleting folders that contain content they can't see.
    if (hasInvisibleFolders || hasInvisibleContent) {
        throw new NotAuthorizedError({
            data: {
                folder,
                hasFolders: hasInvisibleFolders,
                hasContent: hasInvisibleContent
            }
        });
    }
};
