import React from "react";
import { DelayedOnChange, Icon, Input } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { useFileManagerApi, useFileManagerView } from "~/index";

export const SearchWidget = () => {
    const fileManager = useFileManagerApi();
    const view = useFileManagerView();

    return (
        <DelayedOnChange value={view.searchQuery} onChange={value => view.setSearchQuery(value)}>
            {({ value, onChange }) => (
                <Input
                    id={"file-manager__search-input"}
                    value={value}
                    onChange={value => onChange(value)}
                    placeholder={view.searchLabel || "Search library..."}
                    disabled={!fileManager.canRead}
                    data-testid={"file-manager.search-input"}
                    startIcon={<Icon label={"Search"} icon={<SearchIcon />} />}
                    size={"md"}
                    variant={"ghost-negative"}
                    className={"wby-max-w-full wby-w-80"}
                />
            )}
        </DelayedOnChange>
    );
};
