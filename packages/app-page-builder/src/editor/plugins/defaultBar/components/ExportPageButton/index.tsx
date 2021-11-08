import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { i18n } from "@webiny/app/i18n";
import useExportPageDialog from "./useExportPageDialog";
import useExportPageRevisionSelectorDialog from "./useExportPageRevisionSelectorDialog";
// assets
import { ReactComponent as DownloadIcon } from "../icons/file_download.svg";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/exportPageButton");

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
                data-testid={"export-page-button"}
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
