import React from "react";
import { EditorSidebarTab, EditorSidebarTabProps } from "~/editor";
import { Compose, HigherOrderComponent } from "@webiny/app-admin";
import { useActiveElement } from "~/editor/hooks/useActiveElement";

const DisableBlockElementTab: HigherOrderComponent<EditorSidebarTabProps> = Tab => {
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
};

export const BlockElementSidebarPlugin = () => {
    return <Compose component={EditorSidebarTab} with={DisableBlockElementTab} />;
};
