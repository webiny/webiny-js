import React from "react";
import SearchUI from "@webiny/app-admin/components/SearchUI";

import { SearchWrapper } from "./styled";

interface SearchProps {
    value: string;
    onChange: (value: string) => void;
}

export const Search: React.VFC<SearchProps> = ({ value, onChange }) => {
    return (
        <SearchWrapper>
            <SearchUI value={value} onChange={onChange} />
        </SearchWrapper>
    );
};
