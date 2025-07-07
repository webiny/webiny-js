import React from "react";
import { Sidebar } from "~/BaseEditor/config/Sidebar/Sidebar";
import { ScrollableContainer } from "~/BaseEditor/config/Sidebar/ScrollableContainer";

export const ElementSettingsGroup = () => {
    return (
        <ScrollableContainer tabIndex={-1}>
            <Sidebar.Group.Tab
                name={"element"}
                label={"Element"}
                element={<Sidebar.Elements group={"element"} />}
            />
        </ScrollableContainer>
    );
};
