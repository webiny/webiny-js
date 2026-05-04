import React from "react";
import type { FiltersOnSubmit } from "@webiny/app-admin";
import { Filters as BaseFilters } from "@webiny/app-admin";
import { useFileManagerViewConfig } from "~/index.js";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";

export const Filters = () => {
    const { vm, actions } = useFileManagerPresenter();
    const { browser } = useFileManagerViewConfig();

    const applyFilters: FiltersOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }

        const convertedFilters = browser.filtersToWhere.reduce(
            (data, converter) => converter(data),
            data
        );

        for (const [key, value] of Object.entries(convertedFilters)) {
            if (value !== undefined) {
                actions.filter.set(key, value);
            }
        }
    };

    return (
        <BaseFilters filters={browser.filters} show={vm.showingFilters} onChange={applyFilters} />
    );
};
