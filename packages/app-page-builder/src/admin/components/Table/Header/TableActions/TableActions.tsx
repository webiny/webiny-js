import React, { ReactElement } from "react";

import { ReactComponent as ExportIcon } from "@material-design-icons/svg/outlined/file_download.svg";
import { ReactComponent as ImportIcon } from "@material-design-icons/svg/outlined/file_upload.svg";
import { i18n } from "@webiny/app/i18n";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";

import useExportPageRevisionSelectorDialog from "~/editor/plugins/defaultBar/components/ExportPageButton/useExportPageRevisionSelectorDialog";
import useExportPageDialog from "~/editor/plugins/defaultBar/components/ExportPageButton/useExportPageDialog";

import { Container } from "./styled";

const t = i18n.ns("app-page-builder/admin/views/pages/table/header/buttons/table-actions");

export interface TableActionsProps {
    selected: string[];
    onImportPage: (event?: React.SyntheticEvent) => void;
}

export const TableActions = ({ selected, onImportPage }: TableActionsProps): ReactElement => {
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
        <Container>
            <Tooltip content={t`Import page`} placement={"bottom"}>
                <IconButton icon={<ImportIcon />} onClick={onImportPage} />
            </Tooltip>
            <Tooltip content={renderExportPagesTooltip(selected)} placement={"bottom"}>
                <IconButton
                    icon={<ExportIcon />}
                    onClick={() => {
                        showExportPageRevisionSelectorDialog({
                            onAccept: () =>
                                showExportPageInitializeDialog({
                                    ids: selected
                                }),
                            selected
                        });
                    }}
                />
            </Tooltip>
        </Container>
    );
};
