import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, TableColumnConfig as ColumnConfig } from "@webiny/app-aco";

const { Table } = AcoConfig;

export { ColumnConfig };

export interface ColumnProps extends React.ComponentProps<typeof AcoConfig.Table.Column> {
    modelIds?: string[];
}

export const Column: React.FC<ColumnProps> = props => {
    return (
        <CompositionScope name={"cms"}>
            <AcoConfig>
                <Table.Column {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};
