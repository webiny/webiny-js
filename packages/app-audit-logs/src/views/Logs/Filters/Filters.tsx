import React, { useMemo } from "react";
import type { FiltersOnSubmit } from "@webiny/app-admin";
import { Filters as BaseFilters } from "@webiny/app-admin";
import { useAuditLogsListConfig } from "~/config/list";
import type { IListAuditLogsVariablesWhere } from "~/hooks/graphql.js";

interface FiltersProps {
    showingFilters: boolean;
    setWhere: (where: Partial<IListAuditLogsVariablesWhere>) => void;
}

export const Filters = ({ showingFilters, setWhere }: FiltersProps) => {
    const { browser } = useAuditLogsListConfig();

    const applyFilters: FiltersOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }

        const convertedFilters = browser.filtersToWhere.reduce(
            (data, converter) => converter(data),
            data
        );

        setWhere(convertedFilters);
    };

    const filters = useMemo(() => {
        return browser.filters.filter(filter => filter.name !== "initiator");
    }, [browser]);

    return <BaseFilters filters={filters} show={showingFilters} onChange={applyFilters} />;
};
