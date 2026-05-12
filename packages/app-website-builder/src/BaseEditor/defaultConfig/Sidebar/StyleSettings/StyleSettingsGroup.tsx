import React from "react";
import { Sidebar } from "~/BaseEditor/config/Sidebar/Sidebar.js";
import { ScrollableContainer } from "~/BaseEditor/config/Sidebar/ScrollableContainer.js";

export const StyleSettingsGroup = () => (
    <ScrollableContainer tabIndex={-1}>
        <Sidebar.Group.Tab
            name={"style"}
            label={"Style"}
            element={<Sidebar.Elements group={"style"} />}
        />
    </ScrollableContainer>
);
