import React from "react";
import { SidebarActions } from "~/editor";
import { createComponentPlugin } from "@webiny/app-admin";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import ElementNotLinked from "~/blockEditor/components/elementSettingsTab/ElementNotLinked";
import VariableSettings from "~/blockEditor/components/elementSettingsTab/VariableSettings";
import VariablesList from "~/blockEditor/components/elementSettingsTab/VariablesList";

export const ElementSettingsTabContentPlugin = createComponentPlugin(
    SidebarActions,
    SidebarActionsWrapper => {
        return function SettingsTabContent({ children, ...props }) {
            const [element] = useActiveElement();
            const canHaveVariable = element && element.type === "heading";
            const hasVariable = element && element.data?.variableId;
            const isBlock = element && element.type === "block";

            return (
                <>
                    {isBlock ? (
                        <VariablesList element={element} />
                    ) : (
                        <SidebarActionsWrapper {...props}>{children}</SidebarActionsWrapper>
                    )}
                    {canHaveVariable && !hasVariable && <ElementNotLinked />}
                    {canHaveVariable && hasVariable && <VariableSettings element={element} />}
                </>
            );
        };
    }
);
