import WebinyError from "@webiny/error";
import { AcoContext } from "~/types";

export const onFolderBeforeDeleteHook = ({ aco }: AcoContext) => {
    aco.folder.onFolderBeforeDelete.subscribe(async ({ folder }) => {
        try {
            const { id, type } = folder;

            // Fetching all child folders
            const [children] = await aco.folder.list({
                where: { type, parentId: id },
                limit: 1
            });

            // Fetching all records inside the folder
            const [records] = await aco.search.list({
                where: { type, location: { folderId: id } },
                limit: 1
            });

            if (children.length > 0 || records.length > 0) {
                throw new WebinyError(
                    "Error: delete all child folders and entries before proceeding.",
                    "DELETE_FOLDER_WITH_CHILDREN",
                    {
                        folder
                    }
                );
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFolderBeforeDelete hook",
                code: "ACO_BEFORE_FOLDER_DELETE_HOOK"
            });
        }
    });
};
