import React from "react";
import { Icon, Input } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";

interface SearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

export const Search = ({ value, onChange, placeholder }: SearchProps) => {
    return (
        <Input
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            size={"md"}
            variant={"ghost"}
            startIcon={<Icon label={"Search"} icon={<SearchIcon />} />}
            className={"wby-w-full"}
        />
    );
};
