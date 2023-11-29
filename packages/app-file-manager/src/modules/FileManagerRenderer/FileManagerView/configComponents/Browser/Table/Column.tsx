import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, TableColumnConfig as ColumnConfig } from "@webiny/app-aco";
import { FileTableItem, TableItem } from "~/types";
import { useTableCell } from "~/hooks/useTableCell";

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

const isFileItem = (item: TableItem): item is FileTableItem => {
    return item?.$type === "RECORD";
};

export const Column = Object.assign(BaseColumn, { isFileItem, useTableCell });
