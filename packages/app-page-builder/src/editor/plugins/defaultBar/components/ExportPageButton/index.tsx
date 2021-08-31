import React, { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Icon } from "@webiny/ui/Icon";

import { ReactComponent as DownloadIcon } from "../icons/file_download.svg";
import { EXPORT_PAGE, GET_EXPORT_PAGE_TASK } from "./graphql";
import useExportPageDialog from "./useExportPageDialog";

const INTERVAL = 0.5 * 1000;

const ExportPageButton: React.FunctionComponent<{ page: any }> = ({ page }) => {
    const { showSnackbar } = useSnackbar();
    const { showExportPageContentDialog, showExportPageLoadingDialog } = useExportPageDialog();
    const [taskId, setTaskId] = useState<string>(null);

    const [exportPage, exportPageResponse] = useMutation(EXPORT_PAGE, {
        onCompleted: response => {
            const { error, data } = get(response, "pageBuilder.exportPage", {});
            if (error) {
                return showSnackbar(error.message);
            }
            setTaskId(data.taskId);
        }
    });
    const { data } = useQuery(GET_EXPORT_PAGE_TASK, {
        variables: {
            id: taskId
        },
        skip: !taskId,
        fetchPolicy: "network-only",
        pollInterval: INTERVAL,
        notifyOnNetworkStatusChange: true
    });

    const pollExportPageTaskStatus = useCallback(response => {
        const { error, data } = get(response, "pageBuilder.getPageExportTask", {});
        if (error) {
            return showSnackbar(error.message);
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
            showExportPageLoadingDialog();
        }
    }, [exportPageResponse]);

    if (!page) {
        return null;
    }

    return (
        <MenuItem
            onClick={async () => {
                await exportPage({ variables: { id: page.id } });
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
