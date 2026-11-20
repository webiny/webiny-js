import type { FolderDto } from "~/domain/folder/FolderDto.js";

/** Enough to resolve a folder named in a question; a folder with more children is rarely on screen whole. */
const MAX_FOLDERS = 30;
const MAX_TITLE = 60;

export interface DescribeFoldersForAssistantParams {
    /** The `FoldersContext` type, which is what `listFolders` takes as `type`. */
    type: string;
    currentFolderId: string | null;
    currentFolderTitle: string;
    /** The folders the view shows, in its own order. */
    childFolders: FolderDto[];
}

/**
 * The folder part of a list's assistant page context, shared by the lists that show a folder tree.
 * Keys are named after the `listFolders` arguments they feed.
 *
 * A function rather than part of `FolderTreePresenter`: that presenter is a singleton with no init
 * or dispose, and the folder picker in forms uses it too, so a context it set would never be
 * cleared. The list that shows the folders owns the context and calls this from its `details`.
 */
export const describeFoldersForAssistant = (
    params: DescribeFoldersForAssistantParams
): Record<string, unknown> => {
    const { type, currentFolderId, currentFolderTitle, childFolders } = params;

    return {
        folderType: type,
        currentFolder: currentFolderId ? { id: currentFolderId, title: currentFolderTitle } : null,
        visibleFolders: childFolders.slice(0, MAX_FOLDERS).map(folder => ({
            id: folder.id,
            title: folder.title.slice(0, MAX_TITLE)
        }))
    };
};
