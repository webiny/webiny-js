import React from "react";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { InputContainer, SearchIconContainer } from "./SearchInput.styled";
import { useTrashBin } from "~/hooks";

export const SearchInput = () => {
    const { presenter, useCases } = useTrashBin();

    return (
        <InputContainer>
            <SearchIconContainer icon={<SearchIcon />} />
            <DelayedOnChange
                value={presenter.vm.searchQuery}
                onChange={value => {
                    if (value === presenter.vm.searchQuery) {
                        return;
                    }
                    useCases.searchItemsUseCase.execute(value);
                }}
            >
                {({ value, onChange }) => (
                    <input
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={presenter.vm.searchLabel}
                        data-testid={"trash-bin.search-input"}
                    />
                )}
            </DelayedOnChange>
        </InputContainer>
    );
};
