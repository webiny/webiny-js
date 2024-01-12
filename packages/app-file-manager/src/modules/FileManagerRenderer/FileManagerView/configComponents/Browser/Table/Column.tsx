import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, TableColumnConfig as ColumnConfig } from "@webiny/app-aco";
import { TableItem } from "~/types";

const { Table } = AcoConfig;

export { ColumnConfig };

type ColumnProps = React.ComponentProps<typeof AcoConfig.Table.Column>;

const BaseColumn = (props: ColumnProps) => {
    return (
        <CompositionScope name={"fm"}>
            <AcoConfig>
                <Table.Column {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};

export const Column = Object.assign(BaseColumn, {
    useTableRow: Table.Column.useTableRow<TableItem>,
    isFolderRow: Table.Column.isFolderRow
});
