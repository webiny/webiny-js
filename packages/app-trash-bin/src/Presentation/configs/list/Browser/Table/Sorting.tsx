import React from "react";
import { AcoConfig, type TableSortingConfig as SortingConfig } from "@webiny/app-aco";

const { Table } = AcoConfig;

export type { SortingConfig };

type SortingProps = React.ComponentProps<typeof AcoConfig.Table.Sorting>;

export const Sorting = (props: SortingProps) => {
    return (
        <AcoConfig>
            <Table.Sorting {...props} />
        </AcoConfig>
    );
};
