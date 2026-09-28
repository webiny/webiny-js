import React, { useMemo, useState } from "react";
import { useDrag, DragPreviewImage } from "react-dnd";
import { Button, Drawer, Icon, Input, Text, cn } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { DASHBOARD_WIDGET_DND_TYPE, EMPTY_DRAG_IMAGE } from "./DashboardWidgetCard.js";
import type { DashboardLayoutPresenter } from "../../dashboardLayout/presenter/abstractions.js";

export interface DrawerWidget {
    name: string;
    title: string;
    description?: string;
    group?: string;
    icon?: React.ReactNode;
    // Already on the dashboard, so it can't be added again.
    added: boolean;
}

interface AddWidgetDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    widgets: DrawerWidget[];
    // False when the dashboard is collapsed to fewer columns and doesn't accept drops.
    canDrag: boolean;
    // True while any widget is being dragged; the drawer steps aside so the columns are reachable.
    dragging: boolean;
    presenter: DashboardLayoutPresenter.Interface;
}

const DEFAULT_GROUP = "Other";

export const AddWidgetDrawer = ({
    open,
    onOpenChange,
    widgets,
    canDrag,
    dragging,
    presenter
}: AddWidgetDrawerProps) => {
    const [search, setSearch] = useState("");

    const groups = useMemo(() => {
        const query = search.trim().toLowerCase();
        const matches = widgets.filter(widget => {
            if (!query) {
                return true;
            }
            return [widget.title, widget.description, widget.group].some(value =>
                value?.toLowerCase().includes(query)
            );
        });

        const byGroup = new Map<string, DrawerWidget[]>();
        for (const widget of matches) {
            const group = widget.group ?? DEFAULT_GROUP;
            byGroup.set(group, [...(byGroup.get(group) ?? []), widget]);
        }
        return [...byGroup.entries()];
    }, [widgets, search]);

    return (
        <Drawer
            open={open}
            onOpenChange={onOpenChange}
            title={"Add widget"}
            description={
                canDrag
                    ? "Drag a widget onto the dashboard, or add it to its default column."
                    : "Add a widget to its default column."
            }
            width={400}
            headerSeparator={true}
            showCloseButton={true}
            className={cn("transition-opacity", dragging && "pointer-events-none opacity-0")}
        >
            <Input
                placeholder={"Search widgets"}
                value={search}
                onChange={setSearch}
                startIcon={<Icon label={"Search"} icon={<SearchIcon />} />}
            />
            {groups.length === 0 ? (
                <Text as={"div"} size={"sm"} className={"mt-lg text-neutral-strong"}>
                    {`No widgets match "${search}".`}
                </Text>
            ) : null}
            {groups.map(([group, items]) => (
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
                        {items.map(widget => (
                            <DrawerWidgetRow
                                key={widget.name}
                                widget={widget}
                                canDrag={canDrag}
                                presenter={presenter}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </Drawer>
    );
};

interface DrawerWidgetRowProps {
    widget: DrawerWidget;
    canDrag: boolean;
    presenter: DashboardLayoutPresenter.Interface;
}

const DrawerWidgetRow = ({ widget, canDrag, presenter }: DrawerWidgetRowProps) => {
    const draggable = canDrag && !widget.added;

    const [, drag, preview] = useDrag(
        {
            type: DASHBOARD_WIDGET_DND_TYPE,
            canDrag: () => draggable,
            item: () => {
                presenter.beginDrag(widget.name);
                return { name: widget.name };
            },
            end: () => {
                presenter.endDrag();
            }
        },
        [draggable, widget.name]
    );

    return (
        <>
            <DragPreviewImage connect={preview} src={EMPTY_DRAG_IMAGE} />
            <div
                ref={node => {
                    drag(node);
                }}
                className={cn(
                    "flex items-start gap-md rounded-md border-sm border-neutral-muted p-sm-extra",
                    draggable && "cursor-grab hover:border-neutral-strong hover:bg-neutral-light"
                )}
            >
                <WidgetThumbnail added={widget.added} />
                <div className={"min-w-0 flex-1"}>
                    <Text as={"div"} size={"md"} className={"font-semibold"}>
                        {widget.title}
                    </Text>
                    {widget.description ? (
                        <Text as={"div"} size={"sm"} className={"mt-xxs text-neutral-strong"}>
                            {widget.description}
                        </Text>
                    ) : null}
                </div>
                <Button
                    size={"sm"}
                    variant={"tertiary"}
                    text={widget.added ? "Added" : "Add"}
                    icon={widget.added ? undefined : <AddIcon />}
                    disabled={widget.added}
                    onClick={() => presenter.addWidget(widget.name)}
                />
            </div>
        </>
    );
};

// A tiny sketch of a widget card: header, two lines of text and a button.
const WidgetThumbnail = ({ added }: { added: boolean }) => {
    return (
        <div
            aria-hidden
            className={
                "flex h-[58px] w-[84px] flex-none flex-col gap-xxs overflow-hidden rounded-sm " +
                "border-sm border-neutral-muted bg-neutral-light p-xs"
            }
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
