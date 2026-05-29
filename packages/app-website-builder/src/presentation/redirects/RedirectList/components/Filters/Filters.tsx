import React from "react";
import type { FiltersOnSubmit } from "@webiny/app-admin";
import { Filters as BaseFilters } from "@webiny/app-admin";
import { observer } from "mobx-react-lite";
import { useRedirectListConfig } from "~/presentation/redirects/RedirectList/index.js";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/index.js";

export const Filters = observer(() => {
    const { browser } = useRedirectListConfig();
    const { vm, actions } = useRedirectListPresenter();

    const applyFilters: FiltersOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }

        const convertedFilters = browser.filtersToWhere.reduce(
            (acc, converter) => converter(acc),
            data
        );

        for (const [key, value] of Object.entries(convertedFilters)) {
            actions.filter.set(key, value);
        }
    };

    return (
        <BaseFilters filters={browser.filters} show={vm.showingFilters} onChange={applyFilters} />
    );
});
