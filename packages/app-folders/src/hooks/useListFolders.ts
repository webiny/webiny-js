import { useSnackbar } from "@webiny/app-admin";
import get from "lodash.get";

import { useFolders } from "./useFolders";

export const useListFolders = () => {
    const { listFolders: list, loading, folders, setFolders } = useFolders();
    const { showSnackbar } = useSnackbar();

    const listFolders = (type: string, useNetwork?: boolean) => {
        list(type, useNetwork).then(response => {
            const error = get(response, "error");
            if (error) {
                return showSnackbar(error.message);
            }

            const data = get(response, "data");
            if (data) {
                setFolders({
                    ...folders,
                    [type]: data || []
                });
            }
        });
    };

    return {
        listFolders,
        loading
    };
};
