import React from "react";
import { SegmentedControl } from "@webiny/admin-ui";
import { Sidebar } from "~/BaseEditor/config/Sidebar/Sidebar.js";
import { ScrollableContainer } from "~/BaseEditor/config/Sidebar/ScrollableContainer.js";

export const ElementSettingsGroup = () => (
    <SegmentedControl.Tabs.Tab
        value={"element"}
        trigger={"Element"}
        content={
            <ScrollableContainer tabIndex={-1}>
                <Sidebar.Elements group={"element"} />
            </ScrollableContainer>
        }
    />
);
