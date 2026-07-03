import React from "react";
import {
    AcoConfig,
    type TableColumnConfig as ColumnConfig,
    type FolderTableRow
} from "@webiny/app-aco";
import { makeDecoratable } from "@webiny/react-composition";
import type { TableRow } from "~/presentation/pages/PageList/types.js";

const { Table } = AcoConfig;

export type { ColumnConfig };

type ColumnProps = React.ComponentProps<typeof AcoConfig.Table.Column>;

const BaseColumnComponent = (props: ColumnProps) => {
    return <Table.Column {...props} />;
};

const BaseColumn = makeDecoratable("Column", BaseColumnComponent);

const isFolderRow = (row: TableRow): row is FolderTableRow => {
    return row.$type === "FOLDER";
};

export const Column = Object.assign(BaseColumn, {
    useTableRow: Table.Column.createUseTableRow<TableRow>(),
    isFolderRow
});
