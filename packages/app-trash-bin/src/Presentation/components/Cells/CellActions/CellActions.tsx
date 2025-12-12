import React from "react";
import { OptionsMenu } from "@webiny/app-admin";
import { TrashBinListConfig, useTrashBinListConfig } from "~/Presentation/configs/index.js";
import { TrashBinItemProvider } from "~/Presentation/hooks/index.js";

export const CellActions = () => {
    const { useTableRow } = TrashBinListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { browser } = useTrashBinListConfig();

    return (
        <TrashBinItemProvider item={row.data}>
            <OptionsMenu
                actions={browser.entryActions}
                data-testid={"table.row.trash.entry.menu-action"}
            />
        </TrashBinItemProvider>
    );
};
