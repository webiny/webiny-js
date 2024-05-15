import React, { useMemo } from "react";
import { Filters as BaseFilters, FiltersOnSubmit } from "@webiny/app-admin";
import { useAuditLogsListConfig } from "~/config/list";

type FiltersProps = {
    showingFilters: boolean;
    setFilters: (data: Record<string, any>) => void;
    hasAccessToUsers: boolean;
};

export const Filters = ({ showingFilters, setFilters, hasAccessToUsers }: FiltersProps) => {
    const { browser } = useAuditLogsListConfig();

    const applyFilters: FiltersOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }

        const convertedFilters = browser.filtersToWhere.reduce(
            (data, converter) => converter(data),
            data
        );

        setFilters(convertedFilters);
    };

    const filters = useMemo(() => {
        if (hasAccessToUsers) {
            return browser.filters;
        }

        return browser.filters.filter(filter => filter.name !== "initiator");
    }, [browser, hasAccessToUsers]);

    return <BaseFilters filters={filters} show={showingFilters} onChange={applyFilters} />;
};
