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
}

const ListViewFilters = observer(({ filters, filtersToWhere }: ListViewFiltersProps) => {
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
            actions.filter.set(key, value);
        }
    };

    return <Filters filters={filters} show={showingFilters} onChange={applyFilters} />;
});

export { ListViewFilters };
