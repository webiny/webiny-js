import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, TableColumnConfig as ColumnConfig } from "@webiny/app-aco";
import { useModel } from "~/admin/components/ModelProvider";
import { useTableCell } from "~/admin/views/contentEntries/hooks";
import { BaseTableItem, FolderTableItem } from "@webiny/app-aco/types";

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

const isFolderItem = (item: BaseTableItem): item is FolderTableItem => {
    return item.$type === "FOLDER";
};

export const Column = Object.assign(BaseColumn, { useTableCell, isFolderItem });
