import React from "react";
import { FolderProvider } from "@webiny/app-aco";
import { makeDecoratable, OptionsMenu } from "@webiny/app-admin";
import type { RedirectDto } from "~/domain/Redirect/index.js";
import { RedirectListConfig } from "~/presentation/redirects/RedirectList/index.js";
import { useRedirectListConfig } from "~/presentation/redirects/RedirectList/index.js";
import { RedirectProvider } from "~/presentation/redirects/RedirectList/hooks/useRedirect.js";

const { useTableRow, isFolderRow } = RedirectListConfig.Browser.Table.Column;

const DefaultCellActions = () => {
    const { row } = useTableRow();
    const { browser } = useRedirectListConfig();

    if (isFolderRow(row)) {
        // If the user cannot manage folder structure, no need to show the menu.
        if (!row.data.canManageStructure) {
            return null;
        }

        return (
            <FolderProvider folder={row.data}>
                <OptionsMenu actions={browser.folder.actions} />
            </FolderProvider>
        );
    }

    return (
        <RedirectProvider redirect={row.data as RedirectDto}>
            <OptionsMenu actions={browser.redirect.actions} />
        </RedirectProvider>
    );
};

export const CellActions = makeDecoratable("CellActions", DefaultCellActions);
