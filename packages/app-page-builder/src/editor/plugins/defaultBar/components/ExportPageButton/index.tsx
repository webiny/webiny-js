import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { i18n } from "@webiny/app/i18n";
import useExportPageDialog, { ExportPagesDialogProps } from "./useExportPageDialog";
import useExportPageRevisionSelectorDialog from "./useExportPageRevisionSelectorDialog";
// assets
import { ReactComponent as DownloadIcon } from "@webiny/app-admin/assets/icons/file_download.svg";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/exportPageButton");

interface ExportPagesButtonProps extends ExportPagesDialogProps {
    getMultiSelected: any;
}

export const ExportPagesButton = ({ getMultiSelected, ...restProps }: ExportPagesButtonProps) => {
    const selected = getMultiSelected();
    const { showExportPageRevisionSelectorDialog } = useExportPageRevisionSelectorDialog();
    const { showExportPageInitializeDialog } = useExportPageDialog();

    const renderExportPagesTooltip = (selected: string[]) => {
        const count = selected.length;
        if (count > 0) {
            return t`Export {count|count:1:page:default:pages}.`({
                count
            });
        }

        return t`Export all pages`;
    };

    return (
        <Tooltip content={renderExportPagesTooltip(selected)} placement={"bottom"}>
            <IconButton
                data-testid={"export-page-button"}
                icon={<DownloadIcon />}
                onClick={() => {
                    showExportPageRevisionSelectorDialog({
                        onAccept: () =>
                            showExportPageInitializeDialog({ ids: selected, ...restProps }),
                        selected
                    });
                }}
            />
        </Tooltip>
    );
};
