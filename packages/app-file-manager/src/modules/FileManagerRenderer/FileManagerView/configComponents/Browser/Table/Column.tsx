import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, TableColumnConfig as ColumnConfig } from "@webiny/app-aco";

const { Table } = AcoConfig;

export { ColumnConfig };

export const Column: React.FC<React.ComponentProps<typeof AcoConfig.Table.Column>> = props => {
    return (
        <CompositionScope name={"fm"}>
            <AcoConfig>
                <Table.Column {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};
