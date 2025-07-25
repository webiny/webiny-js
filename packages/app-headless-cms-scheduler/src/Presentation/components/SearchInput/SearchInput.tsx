import React from "react";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { InputContainer, SearchIconContainer } from "./SearchInput.styled";
import { useScheduler } from "~/Presentation/hooks";

export const SearchInput = () => {
    const { vm, searchItems } = useScheduler();

    return (
        <InputContainer>
            <SearchIconContainer icon={<SearchIcon />} />
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
                    <input
                        id={"scheduler__search-input"}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={vm.searchLabel}
                        data-testid={"scheduler.search-input"}
                    />
                )}
            </DelayedOnChange>
        </InputContainer>
    );
};
