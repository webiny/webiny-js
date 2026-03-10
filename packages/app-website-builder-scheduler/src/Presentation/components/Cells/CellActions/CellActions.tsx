import React from "react";
import { OptionsMenu } from "@webiny/app-admin";
import { WbSchedulerListConfig, useWbSchedulerListConfig } from "~/Presentation/configs/index.js";
import { WbSchedulerItemProvider } from "~/Presentation/hooks/index.js";

export const CellActions = () => {
    const { useTableRow } = WbSchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { browser } = useWbSchedulerListConfig();

    return (
        <WbSchedulerItemProvider item={row.data}>
            <OptionsMenu
                actions={browser.entryActions}
                data-testid={"table.row.wb-scheduler.entry.menu-action"}
            />
        </WbSchedulerItemProvider>
    );
};
