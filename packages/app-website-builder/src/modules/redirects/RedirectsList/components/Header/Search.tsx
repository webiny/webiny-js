import React from "react";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { DelayedOnChange, Icon, Input } from "@webiny/admin-ui";
import { observer } from "mobx-react-lite";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/RedirectListPresenterProvider.js";

export const Search = observer(() => {
    const { vm, actions } = useRedirectListPresenter();

    return (
        <DelayedOnChange
            value={vm.list.search}
            onChange={value => {
                const searchQuery = value.trim();

                if (searchQuery === vm.list.search) {
                    return;
                }

                if (!searchQuery) {
                    actions.search.clear();
                    return;
                }

                actions.search.set(searchQuery);
            }}
        >
            {({ value, onChange }) => (
                <Input
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    forwardEventOnChange={true}
                    placeholder={"Search..."}
                    startIcon={<Icon icon={<SearchIcon />} label="Search" />}
                    size={"md"}
                    variant={"ghost"}
                    className={"w-full"}
                />
            )}
        </DelayedOnChange>
    );
});
