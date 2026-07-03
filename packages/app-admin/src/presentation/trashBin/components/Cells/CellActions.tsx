import React from "react";
import { OptionsMenu } from "~/index.js";
import { TrashBinListConfig, useTrashBinListConfig } from "../../configs/index.js";
import { TrashBinItemProvider } from "../../hooks/index.js";

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
