import React from "react";
import {
    AcoConfig,
    type FolderTableRow,
    type RecordTableRow,
    type TableColumnConfig as ColumnConfig
} from "@webiny/app-aco";
import { makeDecoratable } from "@webiny/react-composition";
import type { RedirectDto } from "~/domain/Redirect/index.js";
import type { TableRow } from "~/presentation/redirects/RedirectList/components/Table/TableRowMapper.js";

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
    useFolderRow: Table.Column.createUseTableRow<FolderTableRow>(),
    useRedirectRow: Table.Column.createUseTableRow<RecordTableRow<RedirectDto>>(),
    isFolderRow
});
