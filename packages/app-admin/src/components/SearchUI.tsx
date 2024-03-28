import React, { useCallback } from "react";
import styled from "@emotion/styled";
import InputField, { OnKeyDownProps } from "./SimpleUI/InputField";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";

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

export interface SearchProps {
    value: string;
    onChange: (value: string) => void;
    onEnter?: () => any;
    inputPlaceholder?: string;
}

const Search = ({ value, onChange, onEnter, inputPlaceholder = "Search..." }: SearchProps) => {
    const inputOnKeyDown = useCallback(
        (e: OnKeyDownProps) => {
            if (typeof onEnter === "function" && e.key === "Enter") {
                onEnter();
            }
        },
        [onEnter]
    );

    return (
        <SearchWrapper data-testid={"default-data-list.search"}>
            <div className="search__icon">
                <SearchIcon />
            </div>
            <InputField
                onKeyDown={inputOnKeyDown}
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
