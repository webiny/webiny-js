import React from "react";
import styled from "@emotion/styled";
import InputField from "./SimpleUI/InputField";
import { ReactComponent as SearchIcon } from "../assets/icons/search-24px.svg";

const SearchWrapper = styled("div")({
    width: "100%",
    height: "100%",
    display: "flex",
    position: "relative",

    "& .search__icon": {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        paddingLeft: "0.25rem",
        color: "var(--mdc-theme-text-secondary-on-background)"
    },

    "& .search__input": {
        width: "100%",
        padding: "0.5rem 0.5rem 0.5rem 2.25rem",
        outline: "none",
        border: "none",
        color: "var(--mdc-theme-text-primary-on-background)",
        "&:focus": {
            outline: "none"
        },
        "&::placeholder": {
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--mdc-theme-text-secondary-on-background)"
        }
    }
});

export type SearchProps = {
    value: string;
    onChange: (value: string) => void;
    inputPlaceholder?: string;
};
const Search = ({ value, onChange, inputPlaceholder = "Search..." }: SearchProps) => {
    return (
        <SearchWrapper data-testid={"default-data-list.search"}>
            <div className="search__icon">
                <SearchIcon />
            </div>
            <InputField
                className="search__input"
                placeholder={inputPlaceholder}
                value={value}
                onChange={onChange}
                autoComplete="off"
            />
        </SearchWrapper>
    );
};

export default Search;
