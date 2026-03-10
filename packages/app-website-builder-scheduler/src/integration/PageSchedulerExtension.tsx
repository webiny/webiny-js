import React from "react";
import { PageListConfig } from "@webiny/app-website-builder";
import { SchedulePageAction } from "./SchedulePageAction.js";
import { ScheduleSidebarButton } from "./ScheduleSidebarButton.js";
import { ScheduleTableColumnCell } from "./ScheduleTableColumn.js";
import { ScheduleBulkAction } from "./ScheduleBulkAction.js";

export const PageSchedulerExtension = () => {
    return (
        <PageListConfig>
            <PageListConfig.Browser.Page.Action
                name={"schedule"}
                element={<SchedulePageAction />}
            />
            <PageListConfig.Browser.Sidebar.Footer
                name={"schedule"}
                element={<ScheduleSidebarButton />}
            />
            <PageListConfig.Browser.Table.Column
                name={"wbSchedule"}
                header={"Scheduled"}
                cell={<ScheduleTableColumnCell />}
                sortable={false}
            />
            <PageListConfig.Browser.BulkAction
                name={"schedulePublish"}
                element={<ScheduleBulkAction />}
            />
        </PageListConfig>
    );
};
