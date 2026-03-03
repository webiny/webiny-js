import React from "react";
import { Tag } from "@webiny/admin-ui";
import { PageListConfig } from "~/modules/pages/configs/index.js";

export const CellLive = () => {
    const { useTableRow, isFolderRow } = PageListConfig.Browser.Table.Column;
    const { row } = useTableRow();

    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    const entry = row.data;
    if (!entry.live?.version) {
        return <>No</>;
    }

    return (
        <Tag
            swatchColor={"#5AC84C"}
            variant={"success-light"}
            content={`Live (v${entry.live.version})`}
        />
    );
};
