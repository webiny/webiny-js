import React from "react";
import type { FiltersOnSubmit } from "@webiny/app-admin";
import { Filters as BaseFilters } from "@webiny/app-admin";
import { useFilterPages } from "~/features/pages/index.js";
import { useDocumentList } from "~/presentation/pages/PageList/components/useDocumentList.js";
import { useNavigateFolder } from "@webiny/app-aco";
import { usePageListConfig } from "~/presentation/pages/PageList/configs/index.js";

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
