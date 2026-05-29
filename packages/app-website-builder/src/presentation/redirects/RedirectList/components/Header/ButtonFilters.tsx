import React from "react";
import { FiltersToggle } from "@webiny/app-admin";
import { observer } from "mobx-react-lite";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/index.js";

export const ButtonFilters = observer(() => {
    const { vm, actions } = useRedirectListPresenter();

    return (
        <FiltersToggle
            onFiltersToggle={() =>
                vm.showingFilters ? actions.hideFilters() : actions.showFilters()
            }
            showingFilters={vm.showingFilters}
        />
    );
});
