import React from "react";
import { DelayedOnChange, Icon, Input } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";

export const SearchWidget = () => {
    const { vm, actions } = useFileManagerPresenter();

    const searchLabel = vm.folders.currentFolder && !vm.folders.isRootFolder
        ? `Search files in "${vm.folders.currentFolderTitle}"`
        : "Search library...";

    return (
        <DelayedOnChange
            value={vm.list.search}
            onChange={value => {
                if (value) {
                    actions.search.set(value);
                } else {
                    actions.search.clear();
                }
            }}
        >
            {({ value, onChange }) => (
                <Input
                    id={"file-manager__search-input"}
                    value={value}
                    onChange={value => onChange(value)}
                    placeholder={searchLabel}
                    disabled={!vm.permissions.canRead}
                    data-testid={"file-manager.search-input"}
                    startIcon={<Icon label={"Search"} icon={<SearchIcon />} />}
                    size={"md"}
                    variant={"ghost"}
                />
            )}
        </DelayedOnChange>
    );
};
