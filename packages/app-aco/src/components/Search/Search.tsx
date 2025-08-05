import React from "react";
import SearchUI from "@webiny/app-admin/components/SearchUI";

import { SearchWrapper } from "./styled";

interface SearchProps {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
}

export const Search = ({ value, placeholder, onChange }: SearchProps) => {
    return (
        <SearchWrapper>
            <SearchUI value={value} inputPlaceholder={placeholder} onChange={onChange} />
        </SearchWrapper>
    );
};
