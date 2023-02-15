import React from "react";
import { SidebarActions } from "~/editor";
import { createComponentPlugin } from "@webiny/app-admin";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import useElementSettings from "~/editor/plugins/elementSettings/hooks/useElementSettings";
import VariableSettings from "~/editor/plugins/elementSettings/variable/VariableSettings";
import { useTemplateMode } from "~/pageEditor/hooks/useTemplateMode";

export const ElementSettingsTabContentPlugin = createComponentPlugin(
    SidebarActions,
    SidebarActionsWrapper => {
        return function SettingsTabContent({ children, ...props }) {
            const [element] = useActiveElement();
            const elementSettings = useElementSettings();
            const [isTemplateMode] = useTemplateMode();

            if (isTemplateMode) {
                return <VariableSettings />;
            }

            const isReferenceBlockElement = element?.data?.blockId;

            return (
                <>
                    <SidebarActionsWrapper {...props}>
                        {isReferenceBlockElement
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
                    {isReferenceBlockElement && <VariableSettings />}
                </>
            );
        };
    }
);
