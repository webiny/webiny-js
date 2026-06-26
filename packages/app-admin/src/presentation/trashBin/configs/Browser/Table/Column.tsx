import React from "react";
import { Column as TableColumn, type ColumnConfig } from "~/config/table/Column.js";
import type { TrashBinItem } from "../../../abstractions.js";
import type { TableRow } from "~/components/Table/table.types.js";

export type { ColumnConfig };

export type TrashBinTableRow = TableRow<TrashBinItem>;

type ColumnProps = React.ComponentProps<typeof TableColumn>;

const BaseColumn = (props: ColumnProps) => {
    return <TableColumn {...props} />;
};

export const Column = Object.assign(BaseColumn, {
    useTableRow: TableColumn.createUseTableRow<TrashBinTableRow>()
});
