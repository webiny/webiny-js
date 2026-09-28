import React, { useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button, Heading, IconButton, Text, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as RestartAltIcon } from "@webiny/icons/restart_alt.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { useSecurity } from "@webiny/app-admin";
import { useAdminConfig } from "@webiny/app-admin";
import { useDashboardLayoutPresenter } from "./dashboardLayout/presenter/useDashboardLayoutPresenter.js";
import { DashboardWidgetColumn } from "./components/dnd/DashboardWidgetColumn.js";
import { DashboardDragLayer } from "./components/dnd/DashboardDragLayer.js";
import { NewColumnDropZone } from "./components/dnd/NewColumnDropZone.js";
import { AddWidgetDrawer, type DrawerWidget } from "./components/dnd/AddWidgetDrawer.js";
import { ColumnCountControl } from "./components/dnd/ColumnCountControl.js";
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
    const groupSize = Math.max(1, Math.ceil(columns.length / count));
    columns.forEach((column, index) => {
        const target = Math.min(Math.floor(index / groupSize), count - 1);
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

const Welcome = () => {
    const { identity } = useSecurity();
    const { widgets } = useAdminConfig();
    const presenter = useDashboardLayoutPresenter();

    // Map of widget name -> React element, so the presenter can deal purely in names.
    const elements = useMemo(() => {
        const map = new Map<string, React.ReactElement>();
        widgets.forEach(widget => map.set(widget.name, widget.element));
        return map;
    }, [widgets]);

    // Display metadata (title/icon) for the "Add widget" drawer and drag preview.
    const titles = useMemo(() => {
        const map = new Map<string, { title: string; icon?: React.ReactNode }>();
        widgets.forEach(widget =>
            map.set(widget.name, { title: widget.title ?? widget.name, icon: widget.icon })
        );
        return map;
    }, [widgets]);

    // The saved layout arrives with the login profile — no extra round-trip.
    const savedLayout = identity?.profile?.dashboardLayout ?? null;

    // Re-initialize the presenter only when the set of registered widgets changes.
    const widgetsKey = widgets.map(w => `${w.name}:${toColumnIndex(w.column)}`).join("|");
    useEffect(() => {
        presenter.init(
            widgets.map(widget => ({
                name: widget.name,
                column: toColumnIndex(widget.column)
            })),
            savedLayout
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [widgetsKey]);

    const [vm, setVm] = useState(presenter.vm);
    useEffect(() => {
        return autorun(() => {
            setVm(presenter.vm);
        });
    }, [presenter]);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const drawerWidgets: DrawerWidget[] = widgets.map(widget => ({
        name: widget.name,
        title: widget.title ?? widget.name,
        description: widget.description,
        group: widget.group,
        icon: widget.icon,
        added: !vm.hidden.includes(widget.name)
    }));
    const dragging = vm.draggingName !== null;

    // How many columns actually fit; below the chosen count we collapse (and go read-only).
    const { ref: containerRef, width } = useContainerWidth();
    const fitCount = width > 0 ? Math.max(1, Math.floor(width / MIN_COLUMN_WIDTH)) : vm.columnCount;
    const effectiveCount = Math.min(vm.columnCount, fitCount);
    const interactive = effectiveCount === vm.columnCount;
    const maxWidth = DASHBOARD_MAX_WIDTH;

    return (
        <DndProvider backend={HTML5Backend}>
            <div className={"my-xxl"} ref={containerRef}>
                <div
                    className={"mb-xl flex items-center justify-between gap-lg"}
                    style={{ maxWidth }}
                >
                    <div>
                        <Heading
                            level={3}
                        >{`Hi ${identity!.displayName}, what are we doing today?`}</Heading>
                        <Text as={"div"} size={"md"} className={"mt-xs text-neutral-strong"}>
                            {"Your dashboard. Arrange the widgets however you work best."}
                        </Text>
                    </div>
                    <div className={"flex flex-none items-center gap-sm"}>
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
                            variant={"primary"}
                            text={"Add widget"}
                            icon={<AddIcon />}
                            onClick={() => setDrawerOpen(true)}
                        />
                    </div>
                </div>
                {interactive ? (
                    <>
                        <DashboardDragLayer titles={titles} />
                        <div className={"flex"} style={{ maxWidth }}>
                            <div className={"flex min-w-0 flex-1 gap-lg"}>
                                {vm.columns.map((names, index) => (
                                    <DashboardWidgetColumn
                                        key={index}
                                        columnIndex={index}
                                        names={names}
                                        draggingName={vm.draggingName}
                                        dropTarget={vm.dropTarget}
                                        canRemoveColumn={vm.columnCount > MIN_COLUMN_COUNT}
                                        elements={elements}
                                        presenter={presenter}
                                        onBrowseWidgets={() => setDrawerOpen(true)}
                                    />
                                ))}
                            </div>
                            {vm.canAddColumn ? (
                                <NewColumnDropZone
                                    visible={dragging}
                                    active={vm.dropNewColumn}
                                    presenter={presenter}
                                />
                            ) : null}
                        </div>
                    </>
                ) : (
                    <div className={"flex gap-lg"} style={{ maxWidth }}>
                        {collapseColumns(vm.columns, effectiveCount).map((names, index) => (
                            <div key={index} className={"flex flex-1 flex-col gap-lg"}>
                                {names.map(name => (
                                    <React.Fragment key={name}>{elements.get(name)}</React.Fragment>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
                <AddWidgetDrawer
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    widgets={drawerWidgets}
                    canDrag={interactive}
                    dragging={dragging}
                    presenter={presenter}
                />
            </div>
        </DndProvider>
    );
};

export default Welcome;
