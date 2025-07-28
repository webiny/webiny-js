import React from "react";
import { Filters as BaseFilters, FiltersOnSubmit } from "@webiny/app-admin";
import { usePageListConfig } from "~/configs/index.js";
import { useFilterPages } from "~/features/pages/index.js";
import { useDocumentList } from "~/modules/pages/PagesList/useDocumentList.js";
import { useNavigateFolder } from "@webiny/app-aco";

export const Filters = () => {
    const { browser } = usePageListConfig();
    const { vm } = useDocumentList();
    const { filterPages } = useFilterPages();
    const { currentFolderId } = useNavigateFolder();

    const applyFilters: FiltersOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }

        const convertedFilters = browser.filtersToWhere.reduce(
            (data, converter) => converter(data),
            data
        );

        filterPages(convertedFilters, currentFolderId);
    };

    return (
        <BaseFilters filters={browser.filters} show={vm.isFilterVisible} onChange={applyFilters} />
    );
};
