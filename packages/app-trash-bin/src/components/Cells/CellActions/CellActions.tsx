import React from "react";
import { useAcoConfig } from "@webiny/app-aco";
import { OptionsMenu } from "@webiny/app-admin";
import { TrashBinListConfig } from "~/configs";
import { TrashBinEntryProvider } from "~/hooks";

export const CellActions = () => {
    const { useTableRow } = TrashBinListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { record: recordConfig } = useAcoConfig();

    return (
        <TrashBinEntryProvider entry={row}>
            <OptionsMenu
                actions={recordConfig.actions}
                data-testid={"table.row.trash.entry.menu-action"}
            />
        </TrashBinEntryProvider>
    );
};
