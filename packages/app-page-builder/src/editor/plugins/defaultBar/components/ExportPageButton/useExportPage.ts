import { useEffect, useState } from "react";
import get from "lodash/get";
import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { EXPORT_PAGES } from "~/admin/graphql/pageImportExport.gql";
import useExportPageDialog from "./useExportPageDialog";

const useExportPage = () => {
    const [taskId, setTaskId] = useState<string>(null);
    const { showSnackbar } = useSnackbar();
    const { showExportPageLoadingDialog } = useExportPageDialog();

    const [exportPage] = useMutation(EXPORT_PAGES, {
        onCompleted: response => {
            const { error, data } = get(response, "pageBuilder.exportPages", {});
            if (error) {
                return showSnackbar(error.message);
            }
            setTaskId(data.task.id);
        }
    });

    useEffect(() => {
        if (taskId) {
            showExportPageLoadingDialog(taskId);
        }
    }, [taskId]);

    return {
        exportPage
    };
};

export default useExportPage;
