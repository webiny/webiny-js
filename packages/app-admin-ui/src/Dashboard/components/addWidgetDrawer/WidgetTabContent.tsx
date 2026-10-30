import React from "react";
import { EmptyState } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import type { DashboardLayoutPresenter } from "../../dashboardLayout/presenter/abstractions.js";
import type { DrawerWidget } from "./types.js";
import { DrawerWidgetRow } from "./DrawerWidgetRow.js";

const DEFAULT_GROUP = "Other";

const matchesSearch = (widget: DrawerWidget, query: string): boolean => {
    if (!query) {
        return true;
    }
    const fields = [widget.title, widget.description, widget.group];
    return fields.some(value => value?.toLowerCase().includes(query));
};

const groupWidgets = (widgets: DrawerWidget[]): [string, DrawerWidget[]][] => {
    const byGroup = new Map<string, DrawerWidget[]>();
    for (const widget of widgets) {
        const group = widget.group ?? DEFAULT_GROUP;
        const items = byGroup.get(group) ?? [];
        byGroup.set(group, [...items, widget]);
    }
    return [...byGroup.entries()];
};

interface WidgetTabContentProps {
    items: DrawerWidget[];
    search: string;
    onSearch: (value: string) => void;
    emptyTitle: string;
    emptyDescription: string;
    columnCount: number;
    presenter: DashboardLayoutPresenter.Interface;
}

export const WidgetTabContent = ({
    items,
    search,
    onSearch,
    emptyTitle,
    emptyDescription,
    columnCount,
    presenter
}: WidgetTabContentProps) => {
    const query = search.trim().toLowerCase();
    const matches = items.filter(widget => matchesSearch(widget, query));
    const groups = groupWidgets(matches);

    let emptyState: React.ReactNode = null;
    if (items.length === 0) {
        emptyState = (
            <EmptyState
                size={"sm"}
                type={"layout"}
                title={emptyTitle}
                description={emptyDescription}
            />
        );
    } else if (matches.length === 0) {
        emptyState = (
            <EmptyState
                size={"sm"}
                type={"select"}
                title={`No widgets match "${search}"`}
                description={"Try a different search."}
            />
        );
    }

    return (
        <div className={"pb-lg"}>
            {items.length > 0 && (
                <Input
                    placeholder={"Search widgets"}
                    value={search}
                    onChange={onSearch}
                    startIcon={<Icon label={"Search"} icon={<SearchIcon />} />}
                />
            )}
            {emptyState && <div className={"mt-lg"}>{emptyState}</div>}
            {groups.map(([group, groupItems]) => (
                <div key={group} className={"mt-lg"}>
                    <Text
                        as={"div"}
                        size={"sm"}
                        className={
                            "mb-sm font-semibold uppercase tracking-wide text-neutral-strong"
                        }
                    >
                        {group}
                    </Text>
                    <div className={"flex flex-col gap-sm"}>
                        {groupItems.map(widget => (
                            <DrawerWidgetRow
                                key={widget.name}
                                widget={widget}
                                columnCount={columnCount}
                                presenter={presenter}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
