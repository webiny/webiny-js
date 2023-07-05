import React from "react";
import { Filters as BaseFilters, FiltersOnSubmit } from "@webiny/app-admin";
import { useFileManagerView, useFileManagerViewConfig } from "~/index";

export const Filters = () => {
    const { showingFilters, setFilters } = useFileManagerView();
    const { browser } = useFileManagerViewConfig();

    const applyFilters: FiltersOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }

        setFilters(data);
    };

    return (
        <BaseFilters
            filters={browser.filters}
            show={showingFilters}
            data={{}}
            onChange={applyFilters}
        />
    );
};
