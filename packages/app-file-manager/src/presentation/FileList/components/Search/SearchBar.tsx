import React from "react";
import { observer } from "mobx-react-lite";
import { DelayedOnChange, Icon, Input } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { useFileListPresenter } from "../../FileListPresenterProvider.js";

const t = i18n.ns("app-file-manager/presentation/search-bar");

/**
 * Search bar component wired to the FileListPresenter.
 * Uses DelayedOnChange for debounced input, reads current search from vm.list.search,
 * and dispatches changes via presenter.actions.search.set().
 */
export const SearchBar = observer(function SearchBar() {
    const { vm, actions } = useFileListPresenter();

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
                    placeholder={t`Search files...`}
                    disabled={!vm.permissions.canRead}
                    data-testid={"fm-search-bar"}
                    startIcon={<Icon label={"Search"} icon={<SearchIcon />} />}
                    size={"md"}
                    variant={"ghost"}
                />
            )}
        </DelayedOnChange>
    );
});
