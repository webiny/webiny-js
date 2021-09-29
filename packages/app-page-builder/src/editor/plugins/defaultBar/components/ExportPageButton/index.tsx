import React, { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Icon } from "@webiny/ui/Icon";

import { ReactComponent as DownloadIcon } from "../icons/file_download.svg";
import { EXPORT_PAGES, GET_PAGE_IMPORT_EXPORT_TASK } from "~/admin/graphql/pageImportExport.gql";
import useExportPageDialog from "./useExportPageDialog";

const INTERVAL = 2 * 1000;

const ExportPageButton: React.FunctionComponent<{ page: any }> = ({ page }) => {
    const { showSnackbar } = useSnackbar();
    const { showExportPageContentDialog, showExportPageLoadingDialog, hideDialog } =
        useExportPageDialog();
    const [taskId, setTaskId] = useState<string>(null);

    const [exportPage, exportPageResponse] = useMutation(EXPORT_PAGES, {
        onCompleted: response => {
            const { error, data } = get(response, "pageBuilder.exportPages", {});
            if (error) {
                return showSnackbar(error.message);
            }
            setTaskId(data.task.id);
        }
    });
    const { data } = useQuery(GET_PAGE_IMPORT_EXPORT_TASK, {
        variables: {
            id: taskId
        },
        skip: taskId === null,
        fetchPolicy: "network-only",
        pollInterval: taskId === null ? 0 : INTERVAL,
        notifyOnNetworkStatusChange: true
    });

    const pollExportPageTaskStatus = useCallback(response => {
        const { error, data } = get(response, "pageBuilder.getPageImportExportTask", {});
        if (error) {
            return showSnackbar(error.message);
        }

        // Handler failed task
        if (data && data.status === "failed") {
            setTaskId(null);
            showSnackbar("Error: Failed to export the page!");
            // TODO: @ashutosh show an informative dialog about error.
            hideDialog();
        }

        if (data && data.status === "completed") {
            setTaskId(null);
            const fileUrl = data.data.url;

            showExportPageContentDialog({ exportUrl: fileUrl });
        }
    }, []);

    // This component will remain as long as we stick to `/page-builder/pages` route.
    useEffect(() => {
        if (!data) {
            return;
        }
        pollExportPageTaskStatus(data);
    }, [data]);

    // Handle Export Page Dialog Flow
    useEffect(() => {
        if (exportPageResponse.loading) {
            showExportPageLoadingDialog(handleCancelExport);
        }
    }, [exportPageResponse]);

    const handleCancelExport = useCallback(() => {
        setTaskId(null);
    }, []);

    if (!page) {
        return null;
    }

    return (
        <MenuItem
            onClick={async () => {
                await exportPage({ variables: { ids: [page.id] } });
            }}
            data-testid={"pb-editor-page-options-menu-export"}
        >
            <ListItemGraphic>
                <Icon icon={<DownloadIcon />} />
            </ListItemGraphic>
            Export
        </MenuItem>
    );
};

export default ExportPageButton;
