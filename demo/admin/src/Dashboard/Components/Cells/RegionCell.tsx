import React from "react";
import { AcoConfig } from "@webiny/app-aco";
import { ReadonlyArticle } from "@demo/shared";

const { Table } = AcoConfig;
const useTableRow = Table.Column.createUseTableRow<ReadonlyArticle>();

export const RegionCell = () => {
    const { row } = useTableRow();

    return (
        <span>
            {row.region?.title || "-"} / {row.language?.name || "-"}
        </span>
    );
};
