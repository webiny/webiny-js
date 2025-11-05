import React from "react";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { Input, DelayedOnChange, Icon } from "@webiny/admin-ui";

interface SearchProps {
    onChange: (value: string) => void;
    value: string;
}

export const Search = ({ onChange, value }: SearchProps) => {
    return (
        <div className={"mb-sm"}>
            <DelayedOnChange value={value} onChange={onChange}>
                {({ value, onChange }) => (
                    <Input
                        size={"lg"}
                        placeholder={"Search entries..."}
                        onChange={onChange}
                        value={value}
                        startIcon={<Icon label="Search" icon={<SearchIcon />} />}
                        variant={"secondary"}
                    />
                )}
            </DelayedOnChange>
        </div>
    );
};
