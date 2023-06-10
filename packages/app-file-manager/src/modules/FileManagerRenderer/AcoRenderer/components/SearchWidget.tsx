import React, { useRef } from "react";
import styled from "@emotion/styled";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
import { ReactComponent as FilterIcon } from "@material-design-icons/svg/outlined/filter_alt.svg";
import { Icon } from "@webiny/ui/Icon";
import { IconButton } from "@webiny/ui/Button";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";
import { useFileManagerAcoView } from "~/modules/FileManagerRenderer/FileManagerAcoViewProvider";

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
    const { showingFilters, showFilters, hideFilters, setSearchQuery } = useFileManagerAcoView();

    const searchInput = useRef<HTMLInputElement>(null);

    const toggleFilters = () => {
        if (showingFilters) {
            hideFilters();
        } else {
            showFilters();
        }
    };

    return (
        <InputSearch>
            <SearchBarIcon icon={<SearchIcon />} />
            <input
                ref={searchInput}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={"Search by filename or tags"}
                disabled={!fileManager.canRead}
                data-testid={"file-manager.search-input"}
            />
            <FilterButton icon={<FilterIcon />} onClick={toggleFilters} />
        </InputSearch>
    );
};
