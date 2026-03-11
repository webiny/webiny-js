import React from "react";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { DelayedOnChange, Icon, Input } from "@webiny/admin-ui";
import { useScheduler } from "~/Presentation/hooks/index.js";

export const SearchInput = () => {
    const { vm, searchItems } = useScheduler();

    return (
        <DelayedOnChange
            value={vm.searchQuery}
            onChange={value => {
                if (value === vm.searchQuery) {
                    return;
                }
                searchItems(value);
            }}
        >
            {({ value, onChange }) => (
                <Input
                    id={"scheduler__search-input"}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    forwardEventOnChange={true}
                    placeholder={vm.searchLabel}
                    data-testid={"scheduler.search-input"}
                    startIcon={<Icon icon={<SearchIcon />} label="Search" />}
                    size={"md"}
                    variant={"ghost"}
                />
            )}
        </DelayedOnChange>
    );
};
