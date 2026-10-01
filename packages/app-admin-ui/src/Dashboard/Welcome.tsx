import React from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Heading } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-admin";
import { useAdminConfig } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { useDashboardLayoutPresenter } from "./dashboardLayout/presenter/useDashboardLayoutPresenter.js";
import { toColumnIndex } from "./dashboardLayout/toColumnIndex.js";
import { AddWidgetDrawer } from "./components/addWidgetDrawer/AddWidgetDrawer.js";
import type { DrawerWidget } from "./components/addWidgetDrawer/types.js";
import { DashboardToolbar } from "./components/DashboardToolbar.js";
import { EditableColumns } from "./components/layout/EditableColumns.js";
import { StaticColumns } from "./components/layout/StaticColumns.js";
import { useColumnsThatFit } from "./components/layout/useColumnsThatFit.js";
import { useWidgetPortals } from "./components/layout/useWidgetPortals.js";
import { DASHBOARD_MAX_WIDTH } from "./components/layout/layoutConstants.js";

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

    // The saved layout arrives with the login profile, so there's no extra request.
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
    const openDrawer = () => setDrawerOpen(true);
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

    const { ref: containerRef, visibleCount, allFit } = useColumnsThatFit(vm.columnCount);
    const placed = vm.columns.flat();
    const { slots, portals } = useWidgetPortals(placed, elements);

    // Customize mode needs every chosen column on screen; too narrow, and it isn't offered.
    const editing = vm.editing && allFit;

    let subtitle = "Your dashboard. Arrange the widgets however you work best.";
    let columns = <StaticColumns columns={vm.columns} visibleCount={visibleCount} slots={slots} />;
    if (editing) {
        subtitle = "Drag widgets to rearrange them, and click Done when you're finished.";
        columns = (
            <EditableColumns
                vm={vm}
                slots={slots}
                titles={titles}
                presenter={presenter}
                onBrowseWidgets={openDrawer}
            />
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className={"my-xxl"} ref={containerRef}>
                {portals}
                <div
                    className={"mb-xl flex items-center justify-between gap-lg"}
                    style={{ maxWidth: DASHBOARD_MAX_WIDTH }}
                >
                    <div>
                        <Heading
                            level={3}
                        >{`Hi ${identity!.displayName}, what are we doing today?`}</Heading>
                        <Text as={"div"} size={"md"} className={"mt-xs text-neutral-strong"}>
                            {subtitle}
                        </Text>
                    </div>
                    <div className={"flex flex-none items-center gap-sm"}>
                        <DashboardToolbar
                            vm={vm}
                            editing={editing}
                            canCustomize={allFit}
                            presenter={presenter}
                            onAddWidget={openDrawer}
                        />
                    </div>
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
