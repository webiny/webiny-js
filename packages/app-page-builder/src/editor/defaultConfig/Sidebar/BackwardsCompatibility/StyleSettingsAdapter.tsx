import React from "react";
import camelCase from "lodash/camelCase";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementStyleSettingsPlugin } from "~/types";
import { EditorConfig } from "~/editor/config";
import { useElementStyleSettings } from "~/editor/plugins/elementSettings/hooks/useElementStyleSettings";

const getPropertyName = (pluginName: string) => {
    return camelCase(pluginName.replace("pb-editor-page-element-style-settings-", ""));
};

interface StyleFromPluginProps {
    name: string;
    plugin: PbEditorPageElementStyleSettingsPlugin;
}

const StyleFromPlugin = ({ name, plugin }: StyleFromPluginProps) => {
    const elementSettings = useElementStyleSettings();

    const currentPlugin = elementSettings.find(esPlugin => esPlugin.plugin.name === plugin.name);

    return currentPlugin ? (
        <>
            {React.cloneElement(plugin.render({ options: currentPlugin.options }), {
                defaultAccordionValue: name === "property"
            })}
        </>
    ) : null;
};

export const StyleSettingsAdapter = () => {
    const stylePlugins = plugins.byType<PbEditorPageElementStyleSettingsPlugin>(
        "pb-editor-page-element-style-settings"
    );

    return (
        <>
            {stylePlugins.map(plugin => {
                const name = getPropertyName(String(plugin.name));
                return (
                    <EditorConfig.Sidebar.ElementProperty
                        key={plugin.name}
                        group={EditorConfig.Sidebar.ElementProperty.STYLE_GROUP}
                        name={name}
                        element={<StyleFromPlugin name={name} plugin={plugin} />}
                    />
                );
            })}
            <EditorConfig.Sidebar.ElementProperty name={"property"} before={"$first"} />
        </>
    );
};
