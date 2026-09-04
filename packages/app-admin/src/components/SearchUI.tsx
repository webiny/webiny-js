import React from "react";

import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { Icon, InputPrimitive } from "@webiny/admin-ui";

export interface SearchProps {
    value: string;
    onChange: (value: string) => void;
    onEnter?: () => any;
    inputPlaceholder?: string;
    dataTestId?: string;
}

export const SearchUI = ({
    value,
    onChange,
    onEnter,
    dataTestId,
    inputPlaceholder = "Search..."
}: SearchProps) => {
    return (
        <InputPrimitive
            id={"search-input"}
            placeholder={inputPlaceholder}
            value={value}
            onChange={onChange}
            onEnter={onEnter}
            autoComplete="off"
            startIcon={<Icon label={"Search"} icon={<SearchIcon />} color={"neutral-strong"} />}
            variant={"ghost"}
            size={"md"}
            data-testid={dataTestId}
        />
    );
};
