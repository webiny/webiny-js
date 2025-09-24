import React, { useCallback } from "react";
import type { FiltersOnSubmit } from "@webiny/app-admin";
import { Filters as BaseFilters } from "@webiny/app-admin";
import { useAuditLogsListConfig } from "~/config/list/index.js";
import type { IListAuditLogsVariablesWhere } from "~/hooks/graphql.js";

interface FiltersProps {
    showingFilters: boolean;
    setWhere: (where: Partial<IListAuditLogsVariablesWhere>) => void;
}

export const Filters = ({ showingFilters, setWhere }: FiltersProps) => {
    const { browser } = useAuditLogsListConfig();

    const applyFilters: FiltersOnSubmit = useCallback(
        data => {
            if (!Object.keys(data).length) {
                return;
            }

            const convertedFilters = browser.filtersToWhere.reduce(
                (data, converter) => converter(data),
                data
            );

            setWhere(convertedFilters);
        },
        [browser.filtersToWhere]
    );

    return <BaseFilters filters={browser.filters} show={showingFilters} onChange={applyFilters} />;
};
