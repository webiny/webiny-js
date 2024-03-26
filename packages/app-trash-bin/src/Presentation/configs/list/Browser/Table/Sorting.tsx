import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { AcoConfig, TableSortingConfig as SortingConfig } from "@webiny/app-aco";

const { Table } = AcoConfig;

export { SortingConfig };

type SortingProps = React.ComponentProps<typeof AcoConfig.Table.Sorting>;

export const Sorting = (props: SortingProps) => {
    return (
        <CompositionScope name={"trash"}>
            <AcoConfig>
                <Table.Sorting {...props} />
            </AcoConfig>
        </CompositionScope>
    );
};
