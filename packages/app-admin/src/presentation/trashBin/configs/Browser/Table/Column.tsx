import React from "react";
import { AcoConfig, type TableColumnConfig as ColumnConfig } from "@webiny/app-aco";
import type { TrashBinItem } from "../../../abstractions.js";
import type { TableRow } from "@webiny/app-aco";

const { Table } = AcoConfig;

export type { ColumnConfig };

export type TrashBinTableRow = TableRow<TrashBinItem>;

type ColumnProps = React.ComponentProps<typeof AcoConfig.Table.Column>;

const BaseColumn = (props: ColumnProps) => {
    return <Table.Column {...props} />;
};

export const Column = Object.assign(BaseColumn, {
    useTableRow: Table.Column.createUseTableRow<TrashBinTableRow>(),
    isFolderRow: Table.Column.isFolderRow
});
