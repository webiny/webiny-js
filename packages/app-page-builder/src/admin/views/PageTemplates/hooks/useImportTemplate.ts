import { useCallback } from "react";
import get from "lodash/get";
import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { IMPORT_TEMPLATES } from "~/admin/graphql/templateImportExport.gql";
import useImportTemplateDialog from "~/editor/plugins/defaultBar/components/ImportButton/template/useImportTemplateDialog";
import useImportTemplateLoadingDialog from "~/editor/plugins/defaultBar/components/ImportButton/template/useImportTemplateLoadingDialog";

const useImportTemplate = () => {
    const [importTemplate] = useMutation(IMPORT_TEMPLATES);
    const { showSnackbar } = useSnackbar();
    const { showImportTemplateDialog } = useImportTemplateDialog();
    const { showImportTemplateLoadingDialog } = useImportTemplateLoadingDialog();

    const importTemplateMutation = useCallback(async (zipFileUrl: string) => {
        try {
            const res = await importTemplate({
                variables: {
                    zipFileUrl
                }
            });

            const { error, data } = get(res, "data.pageBuilder.importTemplates", {});
            if (error) {
                showSnackbar(error.message);
                return;
            }

            showImportTemplateLoadingDialog({ taskId: data.task.id });
        } catch (e) {
            showSnackbar(e.message);
        }
    }, []);

    const showImportDialog = useCallback(() => {
        showImportTemplateDialog(async url => {
            await importTemplateMutation(url);
        });
    }, []);

    return {
        importTemplateMutation,
        showImportDialog
    };
};

export default useImportTemplate;
