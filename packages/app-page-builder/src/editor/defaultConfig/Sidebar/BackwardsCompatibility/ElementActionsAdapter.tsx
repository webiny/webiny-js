import React from "react";
import camelCase from "lodash/camelCase";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementSettingsPlugin } from "~/types";
import { EditorConfig } from "~/editor/config";
import { useElementSettings } from "~/editor/plugins/elementSettings/hooks/useElementSettings";

const getActionName = (pluginName: string) => {
    return camelCase(pluginName.replace("pb-editor-page-element-settings-", ""));
};

interface ShouldRenderProps {
    plugin: PbEditorPageElementSettingsPlugin;
    children: React.ReactNode;
}

/**
 * This component runs the same logic we used in the previous implementation of element settings.
 * In the previous implementation, we used to calculate actions based on the active element, and render those.
 * With this new approach, we always render all actions, and hide them conditionally.
 */
const ShouldRender = ({ plugin, children }: ShouldRenderProps) => {
    const elementActions = useElementSettings();

    const shouldRender = elementActions.find(action => action.plugin.name === plugin.name);

    return shouldRender ? <>{children}</> : null;
};

export const ElementActionsAdapter = () => {
    const actionPlugins = plugins.byType<PbEditorPageElementSettingsPlugin>(
        "pb-editor-page-element-settings"
    );

    return (
        <>
            {actionPlugins.map((plugin, index) => {
                const element =
                    typeof plugin.renderAction === "function" ? plugin.renderAction({}) : null;

                return (
                    <EditorConfig.Sidebar.ElementAction
                        key={plugin.name + "-" + index}
                        name={getActionName(String(plugin.name))}
                        element={<ShouldRender plugin={plugin}>{element}</ShouldRender>}
                    />
                );
            })}
        </>
    );
};
