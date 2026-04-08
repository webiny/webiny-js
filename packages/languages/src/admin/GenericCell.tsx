import React from "react";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import type { CmsContentEntry } from "@webiny/app-headless-cms/types.js";

export interface GenericCellProps {
    render: (data: CmsContentEntry) => React.ReactNode;
}

export const GenericCell = (props: GenericCellProps) => {
    const { useTableRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow<CmsContentEntry>();

    if (!row.data.createdOn) {
        return <>{"-"}</>;
    }

    return <>{props.render(row.data)}</>;
};
