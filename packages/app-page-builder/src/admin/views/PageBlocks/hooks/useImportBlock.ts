import { useCallback } from "react";
import get from "lodash/get";
import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { IMPORT_BLOCKS } from "~/admin/graphql/blockImportExport.gql";
import useImportBlockDialog from "~/editor/plugins/defaultBar/components/ImportButton/block/useImportBlockDialog";
import useImportBlockLoadingDialog from "~/editor/plugins/defaultBar/components/ImportButton/block/useImportBlockLoadingDialog";

const useImportBlock = () => {
    const [importBlock] = useMutation(IMPORT_BLOCKS);
    const { showSnackbar } = useSnackbar();
    const { showImportBlockDialog } = useImportBlockDialog();
    const { showImportBlockLoadingDialog } = useImportBlockLoadingDialog();

    const importBlockMutation = useCallback(async (zipFileUrl: string) => {
        try {
            const res = await importBlock({
                variables: {
                    zipFileUrl
                }
            });

            const { error, data } = get(res, "data.pageBuilder.importBlocks", {});
            if (error) {
                showSnackbar(error.message);
                return;
            }

            showImportBlockLoadingDialog({ taskId: data.task.id });
        } catch (e) {
            showSnackbar(e.message);
        }
    }, []);

    const showImportDialog = useCallback(() => {
        showImportBlockDialog(async url => {
            await importBlockMutation(url);
        });
    }, []);

    return {
        importBlockMutation,
        showImportDialog
    };
};

export default useImportBlock;
