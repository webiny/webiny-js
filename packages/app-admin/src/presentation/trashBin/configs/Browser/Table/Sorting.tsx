import React from "react";
import { Sorting as TableSorting, type SortingConfig } from "~/config/table/Sorting.js";

export type { SortingConfig };

type SortingProps = React.ComponentProps<typeof TableSorting>;

export const Sorting = (props: SortingProps) => {
    return <TableSorting {...props} />;
};
