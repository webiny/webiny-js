import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { AcoConfig, type TableColumnConfig as ColumnConfig } from "@webiny/app-aco";
import type { TableItem } from "~/types.js";
import { IsApplicableToCurrentModel } from "~/admin/config/IsApplicableToCurrentModel.js";

const { Table } = AcoConfig;

export type { ColumnConfig };

export interface ColumnProps extends React.ComponentProps<typeof AcoConfig.Table.Column> {
    modelIds?: string[];
}

const BaseColumnComponent = ({ modelIds = [], ...props }: ColumnProps) => {
    return (
        <IsApplicableToCurrentModel modelIds={modelIds}>
            <Table.Column {...props} />
        </IsApplicableToCurrentModel>
    );
};

const BaseColumn = makeDecoratable("Column", BaseColumnComponent);

const isFolderRow = (row: TableItem): row is Extract<TableItem, { $type: "FOLDER" }> => {
    return row.$type === "FOLDER";
};

export const Column = Object.assign(BaseColumn, {
    useTableRow: Table.Column.createUseTableRow<TableItem>(),
    isFolderRow
});
