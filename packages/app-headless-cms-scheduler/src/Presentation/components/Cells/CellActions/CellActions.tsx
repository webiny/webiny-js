import React from "react";
import { useAcoConfig } from "@webiny/app-aco";
import { OptionsMenu } from "@webiny/app-admin";
import { SchedulerListConfig } from "~/Presentation/configs";
import { SchedulerItemProvider } from "~/Presentation/hooks";

export const CellActions = () => {
    const { useTableRow } = SchedulerListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { record: recordConfig } = useAcoConfig();

    return (
        <SchedulerItemProvider item={row}>
            <OptionsMenu
                actions={recordConfig.actions}
                data-testid={"table.row.scheduler.entry.menu-action"}
            />
        </SchedulerItemProvider>
    );
};
