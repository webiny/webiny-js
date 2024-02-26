import { useCallback } from "react";
import { CmsModel } from "~/types";
import { useApolloClient } from "~/admin/hooks";
import { runExport } from "./runExport";
import { useSnackbar } from "@webiny/app-admin";
import { download } from "./download";

export const useModelExport = () => {
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();

    const handleModelsExport = useCallback((models?: string[]) => {
        (async () => {
            const result = await runExport({
                client,
                models
            });
            if (result.error) {
                return showSnackbar(result.error.message);
            } else if (!result.data?.models?.length) {
                return showSnackbar("No data returned from the exportStructure query.");
            }
            download(result.data);
        })();
    }, []);

    const handleModelExport = useCallback(
        (model: CmsModel) => {
            return () => {
                handleModelsExport([model.modelId]);
            };
        },
        [handleModelsExport]
    );

    return {
        handleModelsExport,
        handleModelExport
    };
};
