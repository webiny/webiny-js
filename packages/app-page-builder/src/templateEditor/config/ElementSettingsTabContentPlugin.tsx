import React from "react";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/round/edit.svg";
import { ReactComponent as RefreshIcon } from "@material-design-icons/svg/round/refresh.svg";
import { plugins } from "@webiny/plugins";
import { SidebarActions } from "~/editor";
import { createComponentPlugin } from "@webiny/app-admin";
import { IconButton } from "@webiny/ui/Button";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import ElementNotLinked from "~/blockEditor/components/elementSettingsTab/ElementNotLinked";
import VariableSettings from "~/blockEditor/components/elementSettingsTab/VariableSettings";
import VariablesList from "~/blockEditor/components/elementSettingsTab/VariablesList";
import useElementSettings from "~/editor/plugins/elementSettings/hooks/useElementSettings";
import { useRefreshBlock } from "~/editor/hooks/useRefreshBlock";
import { PbBlockEditorCreateVariablePlugin, PbEditorElement } from "~/types";

export const ElementSettingsTabContentPlugin = createComponentPlugin(
    SidebarActions,
    SidebarActionsWrapper => {
        const variablePlugins = plugins.byType<PbBlockEditorCreateVariablePlugin>(
            "pb-block-editor-create-variable"
        );

        return function SettingsTabContent({ children, ...props }) {
            const [element] = useActiveElement();
            const elementSettings = useElementSettings();
            const refreshBlock = useRefreshBlock(element as PbEditorElement);
            const canHaveVariable =
                element &&
                variablePlugins.some(variablePlugin => variablePlugin.elementType === element.type);
            const hasVariable = element && element.data?.variableId;
            const isBlock = element && element.type === "block";
            const isReferenceBlock = element && element.data?.blockId;

            return (
                <>
                    <SidebarActionsWrapper {...props}>
                        {isReferenceBlock ? (
                            <>
                                {elementSettings.map(({ plugin, options }, index) => {
                                    return (
                                        <div key={plugin.name + "-" + index}>
                                            {typeof plugin.renderAction === "function" &&
                                                plugin.name !==
                                                    "pb-editor-page-element-settings-save" &&
                                                plugin.renderAction({ options })}
                                        </div>
                                    );
                                })}
                                <IconButton
                                    icon={<EditIcon />}
                                    onClick={() =>
                                        window.open(
                                            `/page-builder/block-editor/${element?.data?.blockId}`,
                                            "_blank",
                                            "noopener"
                                        )
                                    }
                                />
                                <IconButton icon={<RefreshIcon />} onClick={refreshBlock} />
                            </>
                        ) : (
                            children
                        )}
                    </SidebarActionsWrapper>
                    {isBlock && !isReferenceBlock && <VariablesList block={element} />}
                    {canHaveVariable && !hasVariable && <ElementNotLinked />}
                    {canHaveVariable && hasVariable && <VariableSettings element={element} />}
                </>
            );
        };
    }
);
