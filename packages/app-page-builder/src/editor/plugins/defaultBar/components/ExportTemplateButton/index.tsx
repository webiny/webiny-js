import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { i18n } from "@webiny/app/i18n";
import useExportTemplateDialog, { ExportTemplatesDialogProps } from "./useExportTemplateDialog";
// assets
import { ReactComponent as DownloadIcon } from "@webiny/app-admin/assets/icons/file_download.svg";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/exportTemplateButton");

interface ExportTemplatesButtonProps extends ExportTemplatesDialogProps {
    getMultiSelected: any;
}

export const ExportTemplatesButton = ({
    getMultiSelected,
    ...restProps
}: ExportTemplatesButtonProps) => {
    const selected = getMultiSelected();
    const { showExportTemplateInitializeDialog } = useExportTemplateDialog();

    const renderExportTemplatesTooltip = (selected: string[]) => {
        const count = selected.length;
        if (count > 0) {
            return t`Export {count|count:1:template:default:templates}.`({
                count
            });
        }

        return t`Export all templates`;
    };

    return (
        <Tooltip content={renderExportTemplatesTooltip(selected)} placement={"bottom"}>
            <IconButton
                data-testid={"export-template-button"}
                icon={<DownloadIcon />}
                onClick={() => showExportTemplateInitializeDialog({ ids: selected, ...restProps })}
            />
        </Tooltip>
    );
};
