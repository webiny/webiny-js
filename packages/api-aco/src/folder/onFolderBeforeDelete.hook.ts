import WebinyError from "@webiny/error";
import { AcoContext, Folder } from "~/types";

const throwDeleteError = (folder: Folder) => {
    throw new WebinyError(
        "Error: delete all child folders and entries before proceeding.",
        "DELETE_FOLDER_WITH_CHILDREN",
        {
            folder
        }
    );
};

export const onFolderBeforeDeleteHook = ({ aco }: AcoContext) => {
    aco.folder.onFolderBeforeDelete.subscribe(async ({ folder }) => {
        try {
            const { id, type } = folder;
            /**
             * First we check for the child folders.
             */
            const [children] = await aco.folder.list({
                where: {
                    type,
                    parentId: id
                },
                limit: 1
            });
            if (children.length > 0) {
                throwDeleteError(folder);
            }
            /**
             * Then for entries in each of the apps.
             * Because we split the apps we must do it like this.
             */
            const apps = aco.listApps();
            for (const app of apps) {
                const [records] = await app.search.list({
                    where: {
                        type,
                        location: {
                            folderId: id
                        }
                    },
                    limit: 1
                });
                if (records.length === 0) {
                    continue;
                }
                throwDeleteError(folder);
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFolderBeforeDelete hook",
                code: "ACO_BEFORE_FOLDER_DELETE_HOOK"
            });
        }
    });
};
