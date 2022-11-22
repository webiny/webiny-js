import { useCallback } from "react";
import get from "lodash/get";
import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { IMPORT_PAGES } from "~/admin/graphql/pageImportExport.gql";
import useImportPageDialog from "~/editor/plugins/defaultBar/components/ImportPageButton/useImportPageDialog";
import useImportPageLoadingDialog from "~/editor/plugins/defaultBar/components/ImportPageButton/useImportPageLoadingDialog";

interface UseImportPageParams {
    setLoadingLabel: () => void;
    clearLoadingLabel: () => void;
    closeDialog: () => void;
}
const useImportPage = ({
    setLoadingLabel,
    clearLoadingLabel,
    closeDialog
}: UseImportPageParams) => {
    const [importPage] = useMutation(IMPORT_PAGES);
    const { showSnackbar } = useSnackbar();
    const { showImportPageDialog } = useImportPageDialog();
    const { showImportPageLoadingDialog } = useImportPageLoadingDialog();

    const importPageMutation = useCallback(async ({ slug: category }, zipFileUrl) => {
        try {
            setLoadingLabel();
            const res = await importPage({
                variables: {
                    category,
                    zipFileUrl
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
        showImportPageDialog(async url => {
            await importPageMutation(category, url);
        });
    }, []);

    return {
        importPageMutation,
        showDialog
    };
};

export default useImportPage;
