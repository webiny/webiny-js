import { ContextPlugin } from "@webiny/api";
import { Folder, FoldersContext } from "~/types";

const filterFolderTreeIds = (folders: Folder[], folderId: string): string[] => {
    function findChildrenIds(acc: string[], curr: Folder, index: number, arr: Folder[]): string[] {
        if (curr.parentId && acc.some(el => el === curr?.parentId)) {
            acc.push(curr.id);
            arr.splice(index, 1);
            return arr.reduce(findChildrenIds, acc);
        }

        return acc;
    }

    const result = folders.reduce(findChildrenIds, [folderId]);

    return [...new Set([...result])];
};

export const afterFolderDelete = () => {
    return new ContextPlugin<FoldersContext>(async ({ folders: foldersContext }) => {
        /**
         * After a folder has been deleted, delete all related links.
         */
        foldersContext.onFolderAfterDelete.subscribe(async ({ folder }) => {
            const { id, type } = folder;

            // Fetching all folders by `type`
            const folders = await foldersContext.listFolders({
                where: { type }
            });

            // Filter folders tree under the given folder `id`
            const folderTreeIds = filterFolderTreeIds(folders, id);

            // Delete all links related to a list of folders ids
            await foldersContext.deleteLinks(folderTreeIds);
        });
    });
};
