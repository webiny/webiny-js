import React from "react";
import { Filters as BaseFilters, FiltersOnSubmit } from "@webiny/app-admin";
import { useContentEntryListConfig } from "~/admin/config/contentEntries";
import { useContentEntriesList } from "~/admin/views/contentEntries/hooks";

export const Filters = () => {
    const { browser } = useContentEntryListConfig();
    const list = useContentEntriesList();

    const applyFilters: FiltersOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }
        list.setFilters(data);
    };

    return (
        <BaseFilters
            filters={browser.filters}
            show={list.showingFilters}
            data={{}}
            onChange={applyFilters}
        />
    );
};
