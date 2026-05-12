import React from "react";
import { Sidebar } from "~/BaseEditor/config/Sidebar/Sidebar.js";
import { ScrollableContainer } from "~/BaseEditor/config/Sidebar/ScrollableContainer.js";

export const ElementSettingsGroup = () => (
    <ScrollableContainer tabIndex={-1}>
        <Sidebar.Group.Tab
            name={"element"}
            label={"Element"}
            element={<Sidebar.Elements group={"element"} />}
        />
    </ScrollableContainer>
);
