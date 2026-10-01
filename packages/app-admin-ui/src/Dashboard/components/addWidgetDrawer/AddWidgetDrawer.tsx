import React from "react";
import { useState } from "react";
import { Drawer } from "@webiny/admin-ui";
import { Tabs } from "@webiny/admin-ui";
import type { DashboardLayoutPresenter } from "../../dashboardLayout/presenter/abstractions.js";
import type { DrawerWidget } from "./types.js";
import { WidgetTabContent } from "./WidgetTabContent.js";

interface AddWidgetDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    widgets: DrawerWidget[];
    columnCount: number;
    presenter: DashboardLayoutPresenter.Interface;
}

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
