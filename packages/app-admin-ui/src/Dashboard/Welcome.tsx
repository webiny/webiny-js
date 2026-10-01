import React from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as RestartAltIcon } from "@webiny/icons/restart_alt.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as DashboardCustomizeIcon } from "@webiny/icons/dashboard_customize.svg";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { useSecurity } from "@webiny/app-admin";
import { useAdminConfig } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { useDashboardLayoutPresenter } from "./dashboardLayout/presenter/useDashboardLayoutPresenter.js";
import { DashboardWidgetColumn } from "./components/dnd/DashboardWidgetColumn.js";
import { DashboardDragLayer } from "./components/dnd/DashboardDragLayer.js";
import { AddWidgetDrawer } from "./components/dnd/AddWidgetDrawer.js";
import type { DrawerWidget } from "./components/dnd/AddWidgetDrawer.js";
import { ColumnCountControl } from "./components/dnd/ColumnCountControl.js";
import { WidgetSlot } from "./components/dnd/WidgetSlot.js";
import { useWidgetHosts } from "./components/dnd/useWidgetHosts.js";
import { MIN_COLUMN_COUNT } from "./dashboardLayout/types.js";

// One width for every column count, so switching columns doesn't move the toolbar or the cards.
const DASHBOARD_MAX_WIDTH = 1600;

// Minimum width a column needs before we collapse to fewer columns on narrow viewports.
const MIN_COLUMN_WIDTH = 360;

/** Measure a container's width so we can decide how many columns actually fit. */
const useContainerWidth = () => {
    const ref = React.useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const node = ref.current;
        if (!node) {
            return;
        }
        setWidth(node.clientWidth);
        const observer = new ResizeObserver(entries => {
            setWidth(entries[0].contentRect.width);
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return { ref, width };
};

/** Fold `columns` into `count` visual columns, contiguously, preserving reading order. */
const collapseColumns = (columns: string[][], count: number): string[][] => {
    const result: string[][] = Array.from({ length: count }, () => []);
    const perColumn = Math.ceil(columns.length / count);
    const groupSize = Math.max(1, perColumn);
    columns.forEach((column, index) => {
        const group = Math.floor(index / groupSize);
        const target = Math.min(group, count - 1);
        result[target].push(...column);
    });
    return result;
};

// Widgets register their column as a legacy string ("left"/"right") or a numeric index.
const toColumnIndex = (column: string | number | undefined): number => {
    if (typeof column === "number") {
        return column;
    }
    return column === "right" ? 1 : 0;
};

const WelcomeBase = () => {
    const { identity } = useSecurity();
    const { widgets } = useAdminConfig();
    const presenter = useDashboardLayoutPresenter();

    // Map of widget name -> React element, so the presenter can deal purely in names.
    const elements = useMemo(() => {
        const map = new Map<string, React.ReactElement>();
        widgets.forEach(widget => map.set(widget.name, widget.element));
        return map;
    }, [widgets]);

    // Widget titles, for the "Add widget" drawer and the drag preview.
    const titles = useMemo(() => {
        const map = new Map<string, { title: string }>();
        widgets.forEach(widget => map.set(widget.name, { title: widget.title ?? widget.name }));
        return map;
    }, [widgets]);

    // The saved layout arrives with the login profile — no extra round-trip.
    const savedLayout = identity?.profile?.dashboardLayout ?? null;

    // Re-initialize the presenter when the user or the set of registered widgets changes.
    const widgetsKey = widgets.map(w => `${w.name}:${toColumnIndex(w.column)}`).join("|");
    useEffect(() => {
        const inputs = widgets.map(widget => ({
            name: widget.name,
            column: toColumnIndex(widget.column)
        }));
        presenter.init(identity!.id, inputs, savedLayout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identity?.id, widgetsKey]);

    // The presenter is a singleton; leaving the dashboard resets per-visit state like Customize mode.
    useEffect(() => {
        return () => presenter.dispose();
    }, [presenter]);

    // A reactive component re-renders when anything it reads from `vm` changes.
    const { vm } = presenter;

    const [drawerOpen, setDrawerOpen] = useState(false);
    const drawerWidgets: DrawerWidget[] = widgets.map(widget => {
        // Same clamping the presenter applies, so "(default)" marks the column it would pick.
        const registeredColumn = toColumnIndex(widget.column);
        return {
            name: widget.name,
            title: widget.title ?? widget.name,
            description: widget.description,
            group: widget.group,
            added: !vm.hidden.includes(widget.name),
            defaultColumn: Math.min(registeredColumn, vm.columnCount - 1)
        };
    });
    const dragging = vm.draggingName !== null;

    // How many columns actually fit; below the chosen count we collapse (and go read-only).
    const { ref: containerRef, width } = useContainerWidth();
    let fitCount = vm.columnCount;
    if (width > 0) {
        const columnsThatFit = Math.floor(width / MIN_COLUMN_WIDTH);
        fitCount = Math.max(1, columnsThatFit);
    }
    const effectiveCount = Math.min(vm.columnCount, fitCount);
    const interactive = effectiveCount === vm.columnCount;
    const maxWidth = DASHBOARD_MAX_WIDTH;
    const openDrawer = () => setDrawerOpen(true);

    // Every widget on the dashboard renders once, into its own container, and each layout below
    // only places a slot for it. See `useWidgetHosts`: moving a widget never remounts it.
    const getHost = useWidgetHosts();
    const placed = vm.columns.flat();
    const slots = new Map<string, React.ReactElement>();
    const portals: React.ReactNode[] = [];
    for (const name of placed) {
        const element = elements.get(name);
        if (!element) {
            continue;
        }
        const host = getHost(name);
        slots.set(name, <WidgetSlot host={host} />);
        const portal = createPortal(element, host, name);
        portals.push(portal);
    }

    // Customize mode needs every chosen column on screen; too narrow, and it isn't offered.
    const editing = vm.editing && interactive;

    // Outside Customize mode the widgets are just laid out. Too narrow for the chosen count,
    // the columns fold together.
    let columns: React.ReactNode;
    if (editing) {
        columns = (
            <>
                <DashboardDragLayer titles={titles} />
                <div className={"flex gap-lg"} style={{ maxWidth }}>
                    {vm.columns.map((names, index) => (
                        <DashboardWidgetColumn
                            key={index}
                            columnIndex={index}
                            names={names}
                            draggingName={vm.draggingName}
                            dropTarget={vm.dropTarget}
                            canRemoveColumn={vm.columnCount > MIN_COLUMN_COUNT}
                            elements={slots}
                            titles={titles}
                            presenter={presenter}
                            onBrowseWidgets={openDrawer}
                        />
                    ))}
                </div>
            </>
        );
    } else {
        const collapsed = collapseColumns(vm.columns, effectiveCount);
        columns = (
            <div className={"flex gap-lg"} style={{ maxWidth }}>
                {collapsed.map((names, index) => (
                    <div key={index} className={"flex flex-1 flex-col gap-lg"}>
                        {names.map(name => (
                            <React.Fragment key={name}>{slots.get(name)}</React.Fragment>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    let subtitle = "Your dashboard. Arrange the widgets however you work best.";
    let toolbar: React.ReactNode;
    if (editing) {
        subtitle = "Drag widgets to rearrange them, and click Done when you're finished.";
        toolbar = (
            <>
                <ColumnCountControl
                    columnCount={vm.columnCount}
                    disabled={dragging}
                    presenter={presenter}
                />
                <Tooltip
                    content={"Reset to default layout"}
                    trigger={
                        <IconButton
                            variant={"tertiary"}
                            size={"md"}
                            icon={<RestartAltIcon />}
                            aria-label={"Reset to default layout"}
                            onClick={() => presenter.resetToDefault()}
                        />
                    }
                />
                <Button
                    variant={"tertiary"}
                    text={"Add widget"}
                    icon={<AddIcon />}
                    onClick={openDrawer}
                />
                <Button
                    variant={"primary"}
                    text={"Done"}
                    icon={<CheckIcon />}
                    onClick={() => presenter.stopEditing()}
                />
            </>
        );
    } else {
        let customizeHint = "Rearrange, add or remove widgets";
        if (!interactive) {
            customizeHint = "Make the window wider to customize the dashboard";
        }
        toolbar = (
            <Tooltip
                content={customizeHint}
                trigger={
                    <Button
                        variant={"tertiary"}
                        text={"Customize"}
                        icon={<DashboardCustomizeIcon />}
                        disabled={!interactive}
                        onClick={() => presenter.startEditing()}
                    />
                }
            />
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className={"my-xxl"} ref={containerRef}>
                {portals}
                <div
                    className={"mb-xl flex items-center justify-between gap-lg"}
                    style={{ maxWidth }}
                >
                    <div>
                        <Heading
                            level={3}
                        >{`Hi ${identity!.displayName}, what are we doing today?`}</Heading>
                        <Text as={"div"} size={"md"} className={"mt-xs text-neutral-strong"}>
                            {subtitle}
                        </Text>
                    </div>
                    <div className={"flex flex-none items-center gap-sm"}>{toolbar}</div>
                </div>
                {columns}
                <AddWidgetDrawer
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    widgets={drawerWidgets}
                    columnCount={vm.columnCount}
                    presenter={presenter}
                />
            </div>
        </DndProvider>
    );
};

const Welcome = createReactiveComponent(WelcomeBase);

export default Welcome;
