import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { IconButton } from "@webiny/admin-ui";
import { SegmentedControl } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as CollapseIcon } from "@webiny/icons/left_panel_open.svg";
import { useCurrentPanel } from "../Panels/usePanel.js";
import { Sidebar } from "./Sidebar.js";

export const Layout = makeDecoratable("SidebarLayout", () => {
    const panel = useCurrentPanel();

    return (
        <div
            data-role="editor-sidebar"
            data-affects-preview={"width"}
            className={
                "bg-neutral-base border-l-sm border-l-neutral-dimmed h-full flex flex-col p-sm"
            }
        >
            {/* In a panel, the sidebar collapses like any other panel. */}
            {panel ? (
                <div className={"flex items-center justify-between pb-sm"}>
                    <Text as="div" size={"sm"} className={"font-semibold text-neutral-primary"}>
                        {panel.label}
                    </Text>
                    <IconButton
                        variant={"ghost"}
                        size={"xs"}
                        icon={<CollapseIcon />}
                        title={`Collapse ${panel.label}`}
                        onClick={panel.close}
                    />
                </div>
            ) : null}
            <SegmentedControl.Tabs className={"flex-1 flex flex-col min-h-0"} variant={"dimmed"}>
                <Sidebar.Elements group={"groups"} />
            </SegmentedControl.Tabs>
        </div>
    );
});
