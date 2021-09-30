import React, { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Icon } from "@webiny/ui/Icon";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { i18n } from "@webiny/app/i18n";
import { EXPORT_PAGES, GET_PAGE_IMPORT_EXPORT_TASK } from "~/admin/graphql/pageImportExport.gql";
import useExportPageDialog from "./useExportPageDialog";
import useExportPageRevisionSelectorDialog from "./useExportPageRevisionSelectorDialog";
// assets
import { ReactComponent as DownloadIcon } from "../icons/file_download.svg";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/exportPageButton");

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

export const ExportPagesButton = ({ getMultiSelected }) => {
    const selected = getMultiSelected();
    const { showExportPageRevisionSelectorDialog } = useExportPageRevisionSelectorDialog();
    const { showExportPageInitializeDialog } = useExportPageDialog();

    const renderExportPagesTooltip = selected => {
        const count = selected.length;
        if (count > 0) {
            return t`Export {count|count:1:page:default:pages}.`({
                count
            });
        }

        return t`Export pages`;
    };

    return (
        <Tooltip content={renderExportPagesTooltip(selected)} placement={"bottom"}>
            <IconButton
                icon={<DownloadIcon />}
                disabled={selected.length === 0}
                onClick={() => {
                    showExportPageRevisionSelectorDialog({
                        onAccept: () => showExportPageInitializeDialog({ ids: selected })
                    });
                }}
            />
        </Tooltip>
    );
};
