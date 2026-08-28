import React from "react";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { Tag, Text, TimeAgo } from "@webiny/admin-ui";

export const CellLive = () => {
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    const entry = row.data;
    if (!entry.live?.version) {
        return <>No</>;
    }

    return (
        <div className={"flex flex-col gap-xxs"}>
            <Tag
                swatchColor={"#5AC84C"}
                variant={"success-light"}
                content={`Live (v${entry.live.version})`}
            />
            {entry.lastPublishedOn ? (
                <Text size={"xs"} className={"text-neutral-strong"}>
                    <TimeAgo datetime={entry.lastPublishedOn} />
                </Text>
            ) : null}
        </div>
    );
};
