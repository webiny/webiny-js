import React from "react";
import { plugins } from "@webiny/plugins";
import { SidebarActions } from "~/editor";
import { createComponentPlugin } from "@webiny/app-admin";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import ElementNotLinked from "~/blockEditor/components/elementSettingsTab/ElementNotLinked";
import VariableSettings from "~/blockEditor/components/elementSettingsTab/VariableSettings";
import VariablesList from "~/blockEditor/components/elementSettingsTab/VariablesList";
import useElementSettings from "~/editor/plugins/elementSettings/hooks/useElementSettings";
import { PbBlockEditorCreateVariablePlugin } from "~/types";

export const ElementSettingsTabContentPlugin = createComponentPlugin(
    SidebarActions,
    SidebarActionsWrapper => {
        const variablePlugins = plugins.byType<PbBlockEditorCreateVariablePlugin>(
            "pb-block-editor-create-variable"
        );

        return function SettingsTabContent({ children, ...props }) {
            const [element] = useActiveElement();
            const elementSettings = useElementSettings();
            const canHaveVariable =
                element &&
                variablePlugins.some(variablePlugin => variablePlugin.elementType === element.type);
            const hasVariable = element && element.data?.variableId;
            const isBlock = element && element.type === "block";
            const isReferenceBlock = element && element.data?.blockId;

            return (
                <>
                    <SidebarActionsWrapper {...props}>
                        {isReferenceBlock
                            ? elementSettings.map(({ plugin, options }, index) => {
                                  return (
                                      <div key={plugin.name + "-" + index}>
                                          {typeof plugin.renderAction === "function" &&
                                              plugin.name !==
                                                  "pb-editor-page-element-settings-save" &&
                                              plugin.renderAction({ options })}
                                      </div>
                                  );
                              })
                            : children}
                    </SidebarActionsWrapper>
                    {isBlock && !isReferenceBlock && <VariablesList block={element} />}
                    {canHaveVariable && !hasVariable && <ElementNotLinked />}
                    {canHaveVariable && hasVariable && <VariableSettings element={element} />}
                </>
            );
        };
    }
);
