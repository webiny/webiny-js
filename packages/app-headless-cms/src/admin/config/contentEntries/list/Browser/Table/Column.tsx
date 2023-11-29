import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, TableColumnConfig as ColumnConfig } from "@webiny/app-aco";
import { useModel } from "~/admin/components/ModelProvider";
import { useTableCell } from "~/admin/views/contentEntries/hooks";
import { EntryTableItem, TableItem } from "~/types";

const { Table } = AcoConfig;

export { ColumnConfig };

export interface ColumnProps extends React.ComponentProps<typeof AcoConfig.Table.Column> {
    modelIds?: string[];
}

const BaseColumn: React.FC<ColumnProps> = ({ modelIds = [], ...props }) => {
    const { model } = useModel();

    if (modelIds.length > 0 && !modelIds.includes(model.modelId)) {
        return null;
    }

    return (
        <CompositionScope name={"cms"}>
            <AcoConfig>
                <Table.Column {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};

const isEntryItem = (item: TableItem): item is EntryTableItem => {
    return item?.$type === "RECORD";
};

export const Column = Object.assign(BaseColumn, { isEntryItem, useTableCell });
