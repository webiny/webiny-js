import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, TableColumnConfig as ColumnConfig } from "@webiny/app-aco";
import { useTableCell } from "~/admin/hooks/useTableCell";
import { PbPageTableItem, TableItem } from "~/types";

const { Table } = AcoConfig;

export { ColumnConfig };

const BaseColumn: React.FC<React.ComponentProps<typeof AcoConfig.Table.Column>> = props => {
    return (
        <CompositionScope name={"pb.page"}>
            <AcoConfig>
                <Table.Column {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};

const isPbPageItem = (item: TableItem): item is PbPageTableItem => {
    return item.$type === "RECORD";
};

export const Column = Object.assign(BaseColumn, { isPbPageItem, useTableCell });
