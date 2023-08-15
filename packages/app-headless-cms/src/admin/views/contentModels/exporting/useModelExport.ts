import { useCallback } from "react";
import { CmsModel } from "~/types";
import { useApolloClient } from "~/admin/hooks";
import { runExport } from "./runExport";
import { useSnackbar } from "@webiny/app-admin";
import { download } from "./download";

export const useModelExport = (models: CmsModel[]) => {
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();

    const handleModelsExport = useCallback(() => {
        (async () => {
            const result = await runExport({
                client
            });
            if (result.error) {
                return showSnackbar(result.error.message);
            } else if (!result.data) {
                return showSnackbar("No data returned from the exportCmsStructure query.");
            }
            download(result.data);
        })();
    }, [models]);

    return {
        handleModelsExport
    };
};
