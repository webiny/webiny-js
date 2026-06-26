import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { DelayedOnChange, Icon, Input } from "@webiny/admin-ui";
import type { ISchedulerListPresenter } from "../abstractions.js";

interface SearchInputProps {
    presenter: ISchedulerListPresenter;
}

export const SearchInput = observer(({ presenter }: SearchInputProps) => {
    const { vm } = presenter.list;

    return (
        <DelayedOnChange
            value={vm.search}
            onChange={value => {
                if (value === vm.search) {
                    return;
                }
                presenter.list.actions.search.set(value);
            }}
        >
            {({ value, onChange }) => (
                <Input
                    id={"scheduler__search-input"}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    forwardEventOnChange={true}
                    placeholder={"Search all items"}
                    data-testid={"scheduler.search-input"}
                    startIcon={<Icon icon={<SearchIcon />} label="Search" />}
                    size={"md"}
                    variant={"ghost"}
                />
            )}
        </DelayedOnChange>
    );
});
