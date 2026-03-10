import React from "react";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/calendar_month.svg";
import { Button } from "@webiny/admin-ui";
import { PageListConfig } from "@webiny/app-website-builder";
import { useDocumentList } from "@webiny/app-website-builder/modules/pages/PagesList/useDocumentList.js";
import type { TableRow } from "@webiny/app-website-builder/modules/pages/types.js";
import { WbScheduler } from "~/Presentation/index.js";

export const ScheduleSidebarButton = () => {
    const { isFolderRow } = PageListConfig.Browser.Table.Column;
    const { vm } = useDocumentList();

    /*
     * Only show the button when exactly one page row is selected.
     * Use the same isFolderRow type guard that ScheduleTableColumn uses so
     * TypeScript narrows each element to RecordTableRow<PageDto> after filtering.
     */
    const pageRows = (vm.selected as TableRow[]).filter(item => !isFolderRow(item));
    if (pageRows.length !== 1) {
        return null;
    }

    const page = pageRows[0].data;

    return (
        <WbScheduler
            targetId={page.id}
            render={({ showScheduler }) => (
                <Button
                    variant={"secondary"}
                    size={"sm"}
                    onClick={showScheduler}
                    className={"w-full"}
                >
                    <ScheduleIcon />
                    Manage schedule
                </Button>
            )}
        />
    );
};
