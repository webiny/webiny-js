import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, TableColumnConfig as ColumnConfig } from "@webiny/app-aco";
import { TableItem } from "~/types";

const { Table } = AcoConfig;

export { ColumnConfig };

const BaseColumn: React.FC<React.ComponentProps<typeof AcoConfig.Table.Column>> = props => {
    return (
        <CompositionScope name={"fm"}>
            <AcoConfig>
                <Table.Column {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};

export const Column = Object.assign(BaseColumn, {
    useTableCell: Table.Column.useTableCell<TableItem>,
    isFolderItem: Table.Column.isFolderItem
});
