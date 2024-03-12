import { useCallback } from "react";
import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import {
    IMPORT_PAGES,
    ImportPagesMutationResponse,
    ImportPagesMutationVariables
} from "~/admin/graphql/pageImportExport.gql";
import useImportPageDialog from "~/editor/plugins/defaultBar/components/ImportButton/page/useImportPageDialog";
import useImportPageLoadingDialog from "~/editor/plugins/defaultBar/components/ImportButton/page/useImportPageLoadingDialog";

interface UseImportPageParams {
    setLoading: () => void;
    clearLoading: () => void;
    closeDialog: () => void;
    folderId?: string;
}
const useImportPage = ({
    setLoading,
    clearLoading,
    closeDialog,
    folderId
}: UseImportPageParams) => {
    const [importPage] = useMutation<ImportPagesMutationResponse, ImportPagesMutationVariables>(
        IMPORT_PAGES
    );
    const { showSnackbar } = useSnackbar();
    const { showImportPageDialog } = useImportPageDialog();
    const { showImportPageLoadingDialog } = useImportPageLoadingDialog();

    const importPageMutation = useCallback(async ({ slug: category }, zipFileUrl, folderId) => {
        try {
            setLoading();
            const response = await importPage({
                variables: {
                    category,
                    zipFileUrl,
                    meta: {
                        location: {
                            folderId
                        }
                    }
                }
            });

            clearLoading();
            closeDialog();

            if (!response.data?.pageBuilder?.importPages) {
                showSnackbar("Missing response from the page import mutation.");
                return;
            }
            const { error, data } = response.data.pageBuilder.importPages;
            if (error) {
                showSnackbar(error.message);
                return;
            } else if (!data) {
                showSnackbar("Missing data from the page import mutation.");
                return;
            }

            showImportPageLoadingDialog({
                taskId: data.task.id
            });
        } catch (e) {
            showSnackbar(e.message);
        }
    }, []);

    const showDialog = useCallback(
        category => {
            showImportPageDialog(async url => {
                await importPageMutation(category, url, folderId);
            });
        },
        [folderId]
    );

    return {
        importPageMutation,
        showDialog
    };
};

export default useImportPage;
