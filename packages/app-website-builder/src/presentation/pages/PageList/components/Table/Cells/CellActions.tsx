import React from "react";
import { FolderProvider } from "@webiny/app-aco";
import { makeDecoratable, OptionsMenu } from "@webiny/app-admin";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { PageListConfig, usePageListConfig } from "~/presentation/pages/PageList/configs/index.js";
import { PageProvider } from "~/presentation/pages/PageList/hooks/usePage.js";

const DefaultCellActions = () => {
    const { useTableRow, isFolderRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { browser } = usePageListConfig();
    const { folder: folderConfig, record: documentConfig } = browser;

    if (isFolderRow(row)) {
        // If the user cannot manage folder structure, no need to show the menu.
        if (!row.data.canManageStructure) {
            return null;
        }

        return (
            <FolderProvider folder={row.data}>
                <OptionsMenu actions={folderConfig.actions} />
            </FolderProvider>
        );
    }

    if (documentConfig.actions.length === 0) {
        return null;
    }

    return (
        <PageProvider page={row.data}>
            <OptionsMenu
                actions={documentConfig.actions}
                trigger={
                    <IconButton
                        icon={<MoreVerticalIcon />}
                        variant={"ghost"}
                        data-testid={"more-options-icon"}
                        aria-label={`Actions for ${row.data.properties.title}`}
                    />
                }
            />
        </PageProvider>
    );
};

export const CellActions = makeDecoratable("CellActions", DefaultCellActions);
