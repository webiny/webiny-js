import React, { ReactElement, useCallback, useMemo } from "react";

import { ReactComponent as ExportIcon } from "@material-design-icons/svg/outlined/file_download.svg";
import { ReactComponent as ImportIcon } from "@material-design-icons/svg/outlined/file_upload.svg";
import { i18n } from "@webiny/app/i18n";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";

import useExportPageRevisionSelectorDialog from "~/editor/plugins/defaultBar/components/ExportPageButton/useExportPageRevisionSelectorDialog";
import useExportPageDialog from "~/editor/plugins/defaultBar/components/ExportPageButton/useExportPageDialog";

import { PbPageDataItem } from "~/types";
import { SearchRecordItem } from "@webiny/app-aco/types";

const t = i18n.ns("app-page-builder/admin/views/pages/table/header/buttons/table-actions");

export interface TableActionsProps {
    selected: SearchRecordItem<PbPageDataItem>[];
    onImportPage: (event?: React.SyntheticEvent) => void;
}

export const TableActions = ({ selected, onImportPage }: TableActionsProps): ReactElement => {
    const { showExportPageRevisionSelectorDialog } = useExportPageRevisionSelectorDialog();
    const { showExportPageInitializeDialog } = useExportPageDialog();

    const renderExportPagesTooltip = useCallback(() => {
        const count = selected.length;
        if (count > 0) {
            return t`Export {count|count:1:page:default:pages}`({
                count
            });
        }

        return t`Export all pages`;
    }, [selected.length]);

    const selectedIds = useMemo(() => {
        return selected.map(item => item.data.pid);
    }, [selected]);

    return (
        <>
            <Tooltip content={t`Import page`} placement={"bottom"}>
                <IconButton icon={<ImportIcon />} onClick={onImportPage} />
            </Tooltip>
            <Tooltip content={renderExportPagesTooltip()} placement={"bottom"}>
                <IconButton
                    icon={<ExportIcon />}
                    onClick={() => {
                        showExportPageRevisionSelectorDialog({
                            onAccept: () =>
                                showExportPageInitializeDialog({
                                    ids: selectedIds
                                }),
                            selected: selectedIds
                        });
                    }}
                />
            </Tooltip>
        </>
    );
};
