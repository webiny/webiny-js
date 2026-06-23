import React, { useMemo } from "react";
import { statuses } from "~/admin/constants.js";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { Tag } from "@webiny/admin-ui";

export const CellStatus = () => {
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    const entry = row.data;

    const variant = useMemo(() => {
        switch (entry.meta.status) {
            case "published":
                return "success";
            case "unpublished":
                return "warning";
            default:
                return "neutral-light";
        }
    }, [entry.meta.status]);

    return (
        <Tag
            variant={variant}
            content={`${statuses[entry.meta.status]}${
                entry.meta.version ? ` (v${entry.meta.version})` : ""
            }`}
        />
    );
};
