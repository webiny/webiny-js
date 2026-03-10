import React from "react";
import { PageListConfig } from "@webiny/app-website-builder";

/**
 * Cell component for the "Scheduled" table column.
 *
 * This is a lightweight indicator: it reads the page row data and checks whether
 * a scheduled-publish system value is present in page.extensions. Doing a live
 * API fetch per row would result in N+1 requests, so we rely on data that is
 * already available in the list response.
 */
export const ScheduleTableColumnCell = () => {
    const { useTableRow, isFolderRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    const page = row.data;
    const scheduledOn: string | undefined =
        page.extensions?.wbScheduler?.publishOn ?? page.extensions?.wbScheduler?.unpublishOn;

    if (!scheduledOn) {
        return <>{"-"}</>;
    }

    const formatted = new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(new Date(scheduledOn));

    return <span title={scheduledOn}>{formatted}</span>;
};
