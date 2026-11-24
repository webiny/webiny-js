import React from "react";
import { AcoConfig, type TableColumnConfig as ColumnConfig } from "@webiny/app-aco";
import type { TableItem } from "~/domain/types.js";
import { makeDecoratable } from "@webiny/react-composition";
import { Property } from "@webiny/react-properties";

const { Table } = AcoConfig;

export type { ColumnConfig };

type ColumnProps = React.ComponentProps<typeof AcoConfig.Table.Column>;

/**
 * The File Manager reads its columns from `browser.table.columns`, so every column
 * must be registered under `browser`, as the table thumbnails are. ACO's
 * `Table.Column` registers `table` at whatever level it's mounted at.
 */
const BaseColumnComponent = (props: ColumnProps) => {
    return (
        <Property id="browser" name={"browser"}>
            <Table.Column {...props} />
        </Property>
    );
};

const BaseColumn = makeDecoratable("Column", BaseColumnComponent);

export const Column = Object.assign(BaseColumn, {
    useTableRow: Table.Column.createUseTableRow<TableItem>(),
    isFolderRow: Table.Column.isFolderRow
});
