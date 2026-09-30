import React from "react";
import { useState } from "react";
import { Button } from "@webiny/admin-ui";
import { Drawer } from "@webiny/admin-ui";
import { DropdownMenu } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Tabs } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as ExpandMoreIcon } from "@webiny/icons/expand_more.svg";
import type { DashboardLayoutPresenter } from "../../dashboardLayout/presenter/abstractions.js";

export interface DrawerWidget {
    name: string;
    title: string;
    description?: string;
    group?: string;
    icon?: React.ReactNode;
    // Already on the dashboard, so it can't be added again.
    added: boolean;
    // Zero-based column the widget registered with, already within the current column count.
    defaultColumn: number;
}

interface AddWidgetDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    widgets: DrawerWidget[];
    columnCount: number;
    presenter: DashboardLayoutPresenter.Interface;
}

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

export const AddWidgetDrawer = ({
    open,
    onOpenChange,
    widgets,
    columnCount,
    presenter
}: AddWidgetDrawerProps) => {
    const [search, setSearch] = useState("");

    const changeOpen = (next: boolean) => {
        // Every visit starts with an empty search.
        if (!next) {
            setSearch("");
        }
        onOpenChange(next);
    };

    const onDashboard = widgets.filter(widget => widget.added);
    const notAdded = widgets.filter(widget => !widget.added);

    // Open where the user can act. When everything is added already, show the whole list.
    let defaultTab = "all";
    if (notAdded.length > 0) {
        defaultTab = "notAdded";
    }

    const renderTab = (items: DrawerWidget[], emptyTitle: string, emptyDescription: string) => (
        <WidgetTabContent
            items={items}
            search={search}
            onSearch={setSearch}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            columnCount={columnCount}
            presenter={presenter}
        />
    );

    return (
        <Drawer
            open={open}
            onOpenChange={changeOpen}
            modal={true}
            title={"Add widget"}
            description={"Pick a column when you add a widget. You can drag it anywhere after."}
            width={400}
            bodyPadding={false}
            headerSeparator={false}
            showCloseButton={true}
        >
            <Tabs
                separator={true}
                spacing={"lg"}
                defaultValue={defaultTab}
                tabs={[
                    <Tabs.Tab
                        key={"notAdded"}
                        value={"notAdded"}
                        trigger={`Not added (${notAdded.length})`}
                        content={renderTab(
                            notAdded,
                            "All widgets are on your dashboard",
                            "Remove a widget from its menu and it shows up here."
                        )}
                    />,
                    <Tabs.Tab
                        key={"onDashboard"}
                        value={"onDashboard"}
                        trigger={`On dashboard (${onDashboard.length})`}
                        content={renderTab(
                            onDashboard,
                            "Your dashboard is empty",
                            "Add a widget from the Not added tab."
                        )}
                    />,
                    <Tabs.Tab
                        key={"all"}
                        value={"all"}
                        trigger={`All (${widgets.length})`}
                        content={renderTab(
                            widgets,
                            "No widgets available",
                            "No app has registered a dashboard widget."
                        )}
                    />
                ]}
            />
        </Drawer>
    );
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

const WidgetTabContent = ({
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

interface DrawerWidgetRowProps {
    widget: DrawerWidget;
    columnCount: number;
    presenter: DashboardLayoutPresenter.Interface;
}

const DrawerWidgetRow = ({ widget, columnCount, presenter }: DrawerWidgetRowProps) => {
    return (
        <div
            className={
                "flex items-start gap-md rounded-md border-sm border-neutral-muted p-sm-extra"
            }
        >
            <WidgetThumbnail added={widget.added} />
            <div className={"min-w-0 flex-1"}>
                <Text as={"div"} size={"md"} className={"font-semibold"}>
                    {widget.title}
                </Text>
                {widget.description && (
                    <Text as={"div"} size={"sm"} className={"mt-xxs text-neutral-strong"}>
                        {widget.description}
                    </Text>
                )}
            </div>
            {widget.added ? (
                <Button size={"sm"} variant={"tertiary"} text={"Added"} disabled={true} />
            ) : (
                <AddToColumnMenu widget={widget} columnCount={columnCount} presenter={presenter} />
            )}
        </div>
    );
};

interface AddToColumnMenuProps {
    widget: DrawerWidget;
    columnCount: number;
    presenter: DashboardLayoutPresenter.Interface;
}

// One item per current column; the widget lands at the bottom of the chosen one.
const AddToColumnMenu = ({ widget, columnCount, presenter }: AddToColumnMenuProps) => {
    const columns = Array.from({ length: columnCount }, (_, index) => index);

    return (
        <DropdownMenu
            trigger={
                <Button
                    size={"sm"}
                    variant={"tertiary"}
                    text={"Add"}
                    icon={<ExpandMoreIcon />}
                    iconPosition={"end"}
                />
            }
        >
            <DropdownMenu.Label text={"Add to"} />
            {columns.map(index => {
                let text = `Column ${index + 1}`;
                if (index === widget.defaultColumn) {
                    text = `${text} (default)`;
                }
                return (
                    <DropdownMenu.Item
                        key={index}
                        text={text}
                        onClick={() => presenter.addWidget(widget.name, index)}
                    />
                );
            })}
        </DropdownMenu>
    );
};

// A tiny sketch of a widget card: header, two lines of text and a button.
const WidgetThumbnail = ({ added }: { added: boolean }) => {
    return (
        <div
            aria-hidden
            className={cn(
                "flex h-[58px] w-[84px] flex-none flex-col gap-xxs overflow-hidden rounded-sm",
                "border-sm border-neutral-muted bg-neutral-light p-xs"
            )}
        >
            <div className={"flex items-center gap-[3px]"}>
                <span
                    className={cn(
                        "size-[7px] rounded-[2px]",
                        added ? "bg-neutral-strong" : "bg-primary"
                    )}
                />
                <span className={"h-[4px] w-[30px] rounded-[2px] bg-neutral-strong/40"} />
            </div>
            <span className={"h-[4px] w-full rounded-[2px] bg-neutral-muted"} />
            <span className={"h-[4px] w-3/4 rounded-[2px] bg-neutral-muted"} />
            <span className={"mt-[2px] h-[12px] w-[40px] rounded-[3px] bg-neutral-dimmed"} />
        </div>
    );
};
