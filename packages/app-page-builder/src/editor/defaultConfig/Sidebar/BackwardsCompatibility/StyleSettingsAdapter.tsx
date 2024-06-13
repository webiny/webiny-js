import React from "react";
import camelCase from "lodash/camelCase";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementStyleSettingsPlugin } from "~/types";
import { EditorConfig } from "~/editor/config";
import { useElementStyleSettings } from "~/editor/plugins/elementSettings/hooks/useElementStyleSettings";

export const getPropertyName = (pluginName: string) => {
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

const { Ui, ElementProperty } = EditorConfig;

export const StyleSettingsAdapter = () => {
    const stylePlugins = plugins.byType<PbEditorPageElementStyleSettingsPlugin>(
        "pb-editor-page-element-style-settings"
    );

    return (
        <>
            {stylePlugins.map(plugin => {
                const name = getPropertyName(String(plugin.name));
                return (
                    <ElementProperty
                        key={plugin.name}
                        group={EditorConfig.ElementProperty.STYLE}
                        name={name}
                        element={
                            <Ui.OnActiveElement>
                                <StyleFromPlugin name={name} plugin={plugin} />
                            </Ui.OnActiveElement>
                        }
                    />
                );
            })}
            <ElementProperty name={"property"} before={"$first"} />
        </>
    );
};
