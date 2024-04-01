import React from "react";
import { Sidebar } from "~/editor/config/Sidebar/Sidebar";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { ScrollableContainer } from "~/editor/defaultConfig/Sidebar/ScrollableContainer";

export const ElementSettingsGroup = () => {
    const [element] = useActiveElement();

    return (
        <ScrollableContainer>
            <Sidebar.Group.Tab
                label={"Element"}
                element={<Sidebar.Elements group={"element"} />}
                disabled={!element}
            />
        </ScrollableContainer>
    );
};
