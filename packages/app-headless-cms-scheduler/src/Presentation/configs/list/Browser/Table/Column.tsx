import React from "react";
import { AcoConfig, type TableColumnConfig as ColumnConfig } from "@webiny/app-aco";
import type { SchedulerEntryTableRow } from "~/types.js";

const { Table } = AcoConfig;

export type { ColumnConfig };

type ColumnProps = React.ComponentProps<typeof AcoConfig.Table.Column>;

const BaseColumn = (props: ColumnProps) => {
    return <Table.Column {...props} />;
};

export const Column = Object.assign(BaseColumn, {
    useTableRow: Table.Column.createUseTableRow<SchedulerEntryTableRow>(),
    isFolderRow: Table.Column.isFolderRow
});
