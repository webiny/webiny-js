import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, TableColumnConfig as ColumnConfig } from "@webiny/app-aco";
import { useTableCell } from "~/hooks/useTableCell";
import { BaseTableItem, FolderTableItem } from "@webiny/app-aco/types";

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

const isFolderItem = (item: BaseTableItem): item is FolderTableItem => {
    return item.$type === "FOLDER";
};

export const Column = Object.assign(BaseColumn, { useTableCell, isFolderItem });
