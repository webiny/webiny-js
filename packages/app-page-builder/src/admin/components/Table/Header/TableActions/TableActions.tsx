import React, { ReactElement } from "react";
import useExportPageRevisionSelectorDialog from "~/editor/plugins/defaultBar/components/ExportPageButton/useExportPageRevisionSelectorDialog";
import useExportPageDialog from "~/editor/plugins/defaultBar/components/ExportPageButton/useExportPageDialog";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as Download } from "@material-design-icons/svg/outlined/file_download.svg";
import { i18n } from "@webiny/app/i18n";
import styled from "@emotion/styled";

const t = i18n.ns("app-page-builder/admin/views/pages/table/header/buttons/export");

export interface TableActionsProps {
    selected: string[];
}

const Container = styled("div")`
    margin-right: 8px;
`;

export const TableActions = ({ selected }: TableActionsProps): ReactElement => {
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
            <Tooltip content={renderExportPagesTooltip(selected)} placement={"bottom"}>
                <IconButton
                    data-testid={"export-page-button"}
                    icon={<Download />}
                    onClick={() => {
                        showExportPageRevisionSelectorDialog({
                            onAccept: () =>
                                showExportPageInitializeDialog({
                                    ids: selected,
                                    where: {},
                                    sort: "createdOn_DESC",
                                    search: { query: "" }
                                }),
                            selected
                        });
                    }}
                />
            </Tooltip>
        </Container>
    );
};
