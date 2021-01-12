import React from "react";
import styled from "@emotion/styled";
import classNames from "classnames";
import { IconButton } from "@webiny/ui/Button";
import InputField from "@webiny/app-admin/components/SimpleUI/InputField";
import { ReactComponent as SearchIcon } from "../assets/icons/search-24px.svg";
import { ReactComponent as ArrowDropDownIcon } from "../assets/icons/arrow_drop_down-24px.svg";

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
    },
    "& .search__advanced": {
        "& .search__advanced-icon": {
            transition: "250ms transform ease-in-out",
            transform: "rotate(0deg)",
            "&.open": {
                transform: "rotate(180deg)"
            }
        }
    }
});

export type SearchProps = {
    value: string;
    onChange: (value: string) => void;
    advancedSearch?: boolean;
    setAdvancedSearch?: (value: boolean) => void;
    showAdvanceSearch?: boolean;
    inputPlaceholder?: string;
};
const Search = ({
    value,
    onChange,
    advancedSearch,
    showAdvanceSearch,
    setAdvancedSearch,
    inputPlaceholder = "Search..."
}: SearchProps) => {
    return (
        <SearchWrapper>
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
            {showAdvanceSearch && (
                <div className="search__advanced">
                    <IconButton
                        className={"search__advanced-button"}
                        onClick={() => setAdvancedSearch(!advancedSearch)}
                        icon={
                            <ArrowDropDownIcon
                                className={classNames("search__advanced-icon", {
                                    open: advancedSearch
                                })}
                            />
                        }
                    />
                </div>
            )}
        </SearchWrapper>
    );
};

export default Search;
