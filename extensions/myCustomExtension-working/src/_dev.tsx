import React, { useRef } from "react";
import { plugins } from "@webiny/plugins";
import type {
    PbEditorPageElementAdvancedSettingsPlugin as BasePbEditorPageElementAdvancedSettingsPlugin,
    PbEditorPageElementPlugin as BasePbEditorPageElementPlugin,
    PbRenderElementPlugin as BasePbRenderElementPlugin
} from "@webiny/app-page-builder/types";

export interface LegacyPluginToReactComponentParams {
    pluginType: string;
    componentDisplayName: string;
}

const legacyPluginToReactComponent = function <TProps extends Record<string, any>>(
    params: LegacyPluginToReactComponentParams
) {
    const Component: React.ComponentType<TProps> = props => {
        const pluginRegistered = useRef<boolean>(false);
        if (!pluginRegistered.current) {
            pluginRegistered.current = true;
            plugins.register({ ...props, type: params.pluginType });
        }

        return null;
    };

    Component.displayName = params.componentDisplayName;

    return Component;
};

export const PbRenderElementPlugin = legacyPluginToReactComponent<
    Pick<BasePbRenderElementPlugin, "elementType" | "render">
>({
    pluginType: "pb-render-page-element",
    componentDisplayName: "PbRenderElementPlugin"
});

export const PbEditorPageElementPlugin = legacyPluginToReactComponent<
    Pick<
        BasePbEditorPageElementPlugin,
        | "type"
        | "elementType"
        | "toolbar"
        | "help"
        | "target"
        | "settings"
        | "create"
        | "render"
        | "canDelete"
        | "canReceiveChildren"
        | "onReceived"
        | "onChildDeleted"
        | "onCreate"
        | "renderElementPreview"
    >
>({
    pluginType: "pb-editor-page-element",
    componentDisplayName: "PbEditorPageElementPlugin"
});

export const PbEditorPageElementAdvancedSettingsPlugin = legacyPluginToReactComponent<
    Pick<BasePbEditorPageElementAdvancedSettingsPlugin, "elementType" | "render" | "onSave">
>({
    pluginType: "pb-editor-page-element-advanced-settings",
    componentDisplayName: "PbEditorPageElementAdvancedSettingsPlugin"
});
