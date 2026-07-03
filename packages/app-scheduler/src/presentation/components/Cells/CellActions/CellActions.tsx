import React from "react";
import { OptionsMenu } from "@webiny/app-admin";
import { SchedulerListConfig, useSchedulerListConfig } from "~/presentation/configs/index.js";
import { SchedulerItemProvider } from "~/presentation/hooks/index.js";

export const CellActions = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { browser } = useSchedulerListConfig();

    return (
        <SchedulerItemProvider item={row.data}>
            <OptionsMenu
                actions={browser.entryActions}
                data-testid={"table.row.scheduler.entry.menu-action"}
            />
        </SchedulerItemProvider>
    );
};
