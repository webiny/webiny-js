import { ContextPlugin } from "@webiny/api";
import { FoldersContext } from "~/types";

export const afterFolderDelete = () => {
    return new ContextPlugin<FoldersContext>(async ({ folders }) => {
        /**
         * After a folder has been deleted, delete all related links.
         */
        folders.onFolderAfterDelete.subscribe(async ({ folder }) => {
            const { id, type } = folder;

            // Fetching all child folders by `type` and `id`
            const children = await folders.listFolders({
                where: { type, parentId: id }
            });

            const ids = [id, ...children.map(child => child.id)];

            await folders.deleteLinks(ids);
        });
    });
};
