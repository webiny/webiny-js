import React from "react";
import { AcoConfig, TableColumnConfig as ColumnConfig } from "@webiny/app-aco";
import type { DocumentDto } from "~/DocumentList/presenters/DocumentListMapper.js";
import { makeDecoratable } from "@webiny/react-composition";

const { Table } = AcoConfig;

export { ColumnConfig };

type ColumnProps = React.ComponentProps<typeof AcoConfig.Table.Column>;

const BaseColumnComponent = (props: ColumnProps) => {
    return (
        <AcoConfig>
            <Table.Column {...props} />
        </AcoConfig>
    );
};

const BaseColumn = makeDecoratable("Column", BaseColumnComponent);

export const Column = Object.assign(BaseColumn, {
    useTableRow: Table.Column.createUseTableRow<DocumentDto>(),
    isFolderRow: Table.Column.isFolderRow
});
