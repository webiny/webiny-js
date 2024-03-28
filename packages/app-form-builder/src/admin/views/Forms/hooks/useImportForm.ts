import { useCallback } from "react";
import get from "lodash/get";
import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { IMPORT_FORMS } from "~/admin/graphql";
import useImportFormDialog from "~/admin/plugins/formsDataList/ImportButton/useImportFormDialog";
import useImportFormLoadingDialog from "~/admin/plugins/formsDataList/ImportButton/useImportFormLoadingDialog";

const useImportForm = () => {
    const [importForm] = useMutation(IMPORT_FORMS);
    const { showSnackbar } = useSnackbar();
    const { showImportFormDialog } = useImportFormDialog();
    const { showImportFormLoadingDialog } = useImportFormLoadingDialog();

    const importFormMutation = useCallback(async (zipFileUrl: string) => {
        try {
            const res = await importForm({
                variables: {
                    zipFileUrl
                }
            });

            const { error, data } = get(res, "data.formBuilder.importForms", {});
            if (error) {
                showSnackbar(error.message);
                return;
            }

            showImportFormLoadingDialog({ taskId: data.task.id });
        } catch (e) {
            showSnackbar(e.message);
        }
    }, []);

    const showImportDialog = useCallback(() => {
        showImportFormDialog(async url => {
            await importFormMutation(url);
        });
    }, []);

    return {
        importFormMutation,
        showImportDialog
    };
};

export default useImportForm;
