import React from "react";
import { observer } from "mobx-react-lite";
import type { FiltersOnSubmit } from "~/components/Filters/Filters.js";
import { Filters } from "~/components/Filters/Filters.js";
import { useListView } from "./context.js";

type Filter = {
    name: string;
    element: React.ReactElement;
};

type FiltersToWhereConverter = (data: Record<string, any>) => Record<string, any>;

export interface ListViewFiltersProps {
    filters: Filter[];
    filtersToWhere?: FiltersToWhereConverter[];
    children?: React.ReactNode;
}

const ListViewFilters = observer(({ filters, filtersToWhere, children }: ListViewFiltersProps) => {
    const { showingFilters, actions } = useListView();

    const applyFilters: FiltersOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }

        const convertedFilters = (filtersToWhere ?? []).reduce(
            (acc, converter) => converter(acc),
            data
        );

        for (const [key, value] of Object.entries(convertedFilters)) {
            if (value === undefined || value === null || value === "") {
                actions.filter.clear(key);
            } else {
                actions.filter.set(key, value);
            }
        }
    };

    return (
        <Filters filters={filters} show={showingFilters} onChange={applyFilters}>
            {children}
        </Filters>
    );
});

export { ListViewFilters };
