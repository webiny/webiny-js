import React from "react";
import { plugins } from "@webiny/plugins";
import { SidebarActions } from "~/editor";
import { createDecorator } from "@webiny/app-admin";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import ElementNotLinked from "~/blockEditor/components/elementSettingsTab/ElementNotLinked";
import VariableSettings from "~/blockEditor/components/elementSettingsTab/VariableSettings";
import VariablesList from "~/blockEditor/components/elementSettingsTab/VariablesList";
import { PbBlockEditorCreateVariablePlugin } from "~/types";

export const ElementSettingsTabContentPlugin = createDecorator(
    SidebarActions,
    SidebarActionsWrapper => {
        const variablePlugins = plugins.byType<PbBlockEditorCreateVariablePlugin>(
            "pb-block-editor-create-variable"
        );

        return function SettingsTabContent({ children, ...props }) {
            const [element] = useActiveElement();
            const canHaveVariable =
                element &&
                variablePlugins.some(variablePlugin => variablePlugin.elementType === element.type);
            const hasVariable = element && element.data?.variableId;
            const isBlock = element && element.type === "block";

            return (
                <>
                    {isBlock ? (
                        <VariablesList block={element} />
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
