import React from "react";
import { AcoConfig } from "@webiny/app-aco";
import { ReadonlyArticle } from "@demo/shared";

const { Table } = AcoConfig;
const useTableRow = Table.Column.createUseTableRow<ReadonlyArticle>();

export const DescriptionCell = () => {
    const { row } = useTableRow();

    return <span>{row.description || row.seoDescription || "-"}</span>;
};
