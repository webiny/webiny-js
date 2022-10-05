import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin";
import get from "lodash.get";

import { useFolders } from "./useFolders";
import { FolderItem } from "~/types";
import { useListFolders } from "./useListFolders";

const t = i18n.ns("app-folders/hooks/use-create-folder");

export const useCreateFolder = () => {
    const { createFolder: create, loading } = useFolders();
    const { listFolders } = useListFolders();
    const { showSnackbar } = useSnackbar();

    const createFolder = async (data: Partial<FolderItem>, type: string) => {
        const response = await create({ ...data, type });

        const error = get(response, "error");
        if (error) {
            return showSnackbar(error.message);
        }

        showSnackbar(t("Folder created successfully!"));

        await listFolders(type, true);
    };

    return {
        createFolder,
        loading
    };
};
