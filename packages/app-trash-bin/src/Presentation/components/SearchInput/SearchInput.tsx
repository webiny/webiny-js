import React from "react";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { DelayedOnChange, Icon, Input } from "@webiny/admin-ui";
import { useTrashBin } from "~/Presentation/hooks/index.js";

export const SearchInput = () => {
    const { vm, searchItems } = useTrashBin();

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
                    id={"trash-bin__search-input"}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    forwardEventOnChange={true}
                    placeholder={vm.searchLabel}
                    data-testid={"trash-bin.search-input"}
                    startIcon={
                        <Icon icon={<SearchIcon />} label="Search" color={"neutral-strong"} />
                    }
                    size={"md"}
                    variant={"ghost"}
                />
            )}
        </DelayedOnChange>
    );
};
