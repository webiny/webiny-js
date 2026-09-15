import React from "react";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { Tag, Tooltip } from "@webiny/admin-ui";
import { formatUtcOffset, useDateFormatter } from "@webiny/app-admin";

export const CellLive = () => {
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const dateFormatter = useDateFormatter();

    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    const entry = row.data;
    if (!entry.live?.version) {
        return <>No</>;
    }

    const tag = (
        <Tag
            swatchColor={"#5AC84C"}
            variant={"success-light"}
            content={`Live (v${entry.live.version})`}
        />
    );

    if (entry.lastPublishedOn) {
        return (
            <Tooltip
                content={`Published ${dateFormatter.format(entry.lastPublishedOn)} (${formatUtcOffset()})`}
                trigger={tag}
            />
        );
    }

    return tag;
};
