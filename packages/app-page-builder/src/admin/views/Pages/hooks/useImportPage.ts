import { useCallback } from "react";
import pick from "lodash/pick";
import get from "lodash/get";
import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { IMPORT_PAGES } from "~/admin/graphql/pageImportExport.gql";
import useImportPageDialog from "~/editor/plugins/defaultBar/components/ImportPageButton/useImportPageDialog";
import useImportPageLoadingDialog from "~/editor/plugins/defaultBar/components/ImportPageButton/useImportPageLoadingDialog";

const useImportPage = ({ setLoadingLabel, clearLoadingLabel, closeDialog }) => {
    const [importPage] = useMutation(IMPORT_PAGES);
    const { showSnackbar } = useSnackbar();
    const { showImportPageDialog } = useImportPageDialog();
    const { showImportPageLoadingDialog } = useImportPageLoadingDialog();

    const importPageMutation = useCallback(async ({ slug: category }, fileKey) => {
        try {
            setLoadingLabel();
            const res = await importPage({
                variables: {
                    category,
                    data: pick(
                        {
                            zipFileKey: fileKey,
                            zipFileUrl: fileKey
                        },
                        [fileKey.startsWith("http") ? "zipFileUrl" : "zipFileKey"]
                    )
                }
            });

            clearLoadingLabel();
            closeDialog();

            const { error, data } = get(res, "data.pageBuilder.importPages", {});
            if (error) {
                showSnackbar(error.message);
                return;
            }

            showImportPageLoadingDialog({ taskId: data.task.id });
        } catch (e) {
            showSnackbar(e.message);
        }
    }, []);

    const showDialog = useCallback(category => {
        showImportPageDialog(
            async key => {
                await importPageMutation(category, key);
            },
            async url => {
                await importPageMutation(category, url);
            }
        );
    }, []);

    return {
        importPageMutation,
        showDialog
    };
};

export default useImportPage;
