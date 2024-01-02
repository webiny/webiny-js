import { useCallback } from "react";
import get from "lodash/get";
import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { IMPORT_PAGES } from "~/admin/graphql/pageImportExport.gql";
import useImportPageDialog from "~/editor/plugins/defaultBar/components/ImportButton/page/useImportPageDialog";
import useImportPageLoadingDialog from "~/editor/plugins/defaultBar/components/ImportButton/page/useImportPageLoadingDialog";
import { PbCategory } from "~/types";

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
    const [importPage] = useMutation(IMPORT_PAGES);
    const { showSnackbar } = useSnackbar();
    const { showImportPageDialog } = useImportPageDialog();
    const { showImportPageLoadingDialog } = useImportPageLoadingDialog();

    const importPageMutation = useCallback(
        async (
            { slug: category }: PbCategory,
            zipFileUrl: string,
            folderId: string | undefined
        ) => {
            try {
                setLoading();
                const res = await importPage({
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

                const { error, data } = get(res, "data.pageBuilder.importPages", {});
                if (error) {
                    showSnackbar(error.message);
                    return;
                }

                showImportPageLoadingDialog({ taskId: data.task.id });
            } catch (e) {
                showSnackbar(e.message);
            }
        },
        []
    );

    const showDialog = useCallback(
        (category: PbCategory) => {
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
