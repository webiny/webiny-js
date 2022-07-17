import React from "react";
import { EditorSidebarTab } from "~/editor";
import { createComponentPlugin } from "@webiny/app-admin";
import { useActiveElement } from "~/editor/hooks/useActiveElement";

export const BlockElementSidebarPlugin = createComponentPlugin(EditorSidebarTab, Tab => {
    return function ElementTab({ children, ...props }) {
        const [element] = useActiveElement();

        const isElementTab = props.label === "Element";

        const shouldBeDisabled = element ? element.type === "block" && isElementTab : false;
        const disabled = Boolean(shouldBeDisabled || props.disabled);

        return (
            <Tab {...props} disabled={disabled}>
                {disabled ? null : children}
            </Tab>
        );
    };
});
