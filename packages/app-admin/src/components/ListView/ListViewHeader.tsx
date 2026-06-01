import React from "react";
import { Heading, Icon, Separator, Skeleton } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { DelayedOnChange, Input } from "@webiny/admin-ui";
import { FiltersToggle } from "~/components/Filters/FiltersToggle.js";
import { observer } from "mobx-react-lite";
import { useListView } from "./context.js";

export interface ListViewHeaderProps {
    title: {
        icon: React.ReactElement;
        text?: string;
        after?: React.ReactNode;
    };
    search?: { placeholder?: string; id?: string; disabled?: boolean } | true;
    filtersToggle?: boolean;
    actions?: React.ReactNode;
}

const SearchInput = observer((props: { placeholder?: string; id?: string; disabled?: boolean }) => {
    const { list, actions } = useListView();

    return (
        <DelayedOnChange
            value={list.search}
            onChange={value => {
                const searchQuery = value.trim();

                if (searchQuery === list.search) {
                    return;
                }

                if (!searchQuery) {
                    actions.search.clear();
                    return;
                }

                actions.search.set(searchQuery);
            }}
        >
            {({ value, onChange }) => (
                <Input
                    id={props.id}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    forwardEventOnChange={true}
                    placeholder={props.placeholder ?? "Search..."}
                    startIcon={<Icon icon={<SearchIcon />} label="Search" />}
                    size={"md"}
                    variant={"ghost"}
                    className={"w-full"}
                    disabled={props.disabled}
                />
            )}
        </DelayedOnChange>
    );
});

const FiltersToggleObserver = observer(() => {
    const { showingFilters, onToggleFilters } = useListView();

    if (!onToggleFilters) {
        return null;
    }

    return <FiltersToggle onFiltersToggle={onToggleFilters} showingFilters={showingFilters} />;
});

const ListViewHeader = ({ title, search, filtersToggle, actions }: ListViewHeaderProps) => {
    const searchProps = search === true ? {} : search;

    return (
        <>
            <div className={"flex flex-col gap-md"}>
                <div className={"w-5/12 pt-md px-lg"}>
                    {title.text !== undefined ? (
                        <div className={"flex gap-sm items-center"}>
                            <Icon
                                icon={title.icon}
                                label={title.text}
                                size={"md"}
                                color={"neutral-strong"}
                            />
                            <Heading level={4} as={"h1"} className={"truncate"}>
                                {title.text}
                            </Heading>
                            {title.after}
                        </div>
                    ) : (
                        <Skeleton size={"xl"} />
                    )}
                </div>
                <div className={"px-md pb-sm"}>
                    <div className={"flex items-center gap-sm w-full"}>
                        {searchProps ? (
                            <div className={"flex-1"}>
                                <SearchInput {...searchProps} />
                            </div>
                        ) : null}
                        <div>
                            <div className={"flex gap-sm"}>
                                {filtersToggle ? <FiltersToggleObserver /> : null}
                                {actions}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Separator />
        </>
    );
};

export { ListViewHeader };
