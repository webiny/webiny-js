import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
import { ReactComponent as FilterIcon } from "@material-design-icons/svg/outlined/filter_alt.svg";
import { ReactComponent as CloseFilterIcon } from "@material-design-icons/svg/outlined/filter_alt_off.svg";
import { Icon } from "@webiny/ui/Icon";
import { IconButton } from "@webiny/ui/Button";
import { useFileManagerApi, useFileManagerView, useFileManagerViewConfig } from "~/index";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";

const SearchBarIcon = styled(Icon)`
    &.mdc-button__icon {
        color: var(--mdc-theme-text-secondary-on-background);
        position: absolute;
        width: 24px;
        height: 24px;
        left: 8px;
        top: 8px;
    }
`;

const FilterButton = styled(IconButton)`
    position: absolute;
    top: -4px;
    right: -3px;
`;

const InputSearch = styled.div`
    background-color: var(--mdc-theme-on-background);
    position: relative;
    height: 32px;
    padding: 3px;
    width: 100%;
    border-radius: 2px;
    > input {
        border: none;
        font-size: 14px;
        width: calc(100% - 10px);
        height: 100%;
        margin-left: 32px;
        background-color: transparent;
        outline: none;
        color: var(--mdc-theme-text-primary-on-background);
    }
`;

export const SearchWidget = () => {
    const fileManager = useFileManagerApi();
    const view = useFileManagerView();
    const { browser } = useFileManagerViewConfig();

    const toggleFilters = () => {
        if (view.showingFilters) {
            view.hideFilters();
        } else {
            view.showFilters();
        }
    };

    return (
        <InputSearch>
            <SearchBarIcon icon={<SearchIcon />} />
            <DelayedOnChange
                value={view.searchQuery}
                onChange={value => view.setSearchQuery(value)}
            >
                {({ value, onChange }) => (
                    <input
                        id={"file-manager__search-input"}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={view.searchLabel || "Search all files"}
                        disabled={!fileManager.canRead}
                        data-testid={"file-manager.search-input"}
                    />
                )}
            </DelayedOnChange>
            {browser.filters.length > 0 ? (
                <FilterButton
                    icon={view.showingFilters ? <CloseFilterIcon /> : <FilterIcon />}
                    onClick={toggleFilters}
                />
            ) : null}
        </InputSearch>
    );
};
