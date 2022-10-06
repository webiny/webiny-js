import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin";
import get from "lodash.get";

import { useFolders } from "./useFolders";
import { FolderItem } from "~/types";

const t = i18n.ns("app-folders/hooks/use-update-folder");

export const useUpdateFolder = () => {
    const { updateFolder: update, loading } = useFolders();
    const { showSnackbar } = useSnackbar();

    const updateFolder = async (id: string, data: Omit<FolderItem, "id">) => {
        const response = await update(id, data);

        const error = get(response, "error");
        if (error) {
            return showSnackbar(error.message);
        }

        showSnackbar(t("Folder updated successfully!"));
    };

    return {
        updateFolder,
        loading
    };
};
