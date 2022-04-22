import * as React from "react";
import OEmbed, { OEmbedProps } from "../../../../components/OEmbed";
import {
    PbEditorElement,
    PbEditorPageElementPlugin,
    PbEditorPageElementAdvancedSettingsPlugin,
    DisplayMode,
    OnCreateActions
} from "~/types";
import { createInitialPerDeviceSettingValue } from "../../../elementSettings/elementSettingsUtils";

interface EmbedPluginConfigRenderCallableParams {
    element: PbEditorElement;
}
interface EmbedPluginConfigRenderCallable {
    (params: EmbedPluginConfigRenderCallableParams): React.ReactNode;
}
interface EmbedPluginConfigRenderElementPreviewCallableParams {
    element: PbEditorElement;
    width: number;
    height: number;
}
interface EmbedPluginConfigRenderElementPreviewCallable {
    (params: EmbedPluginConfigRenderElementPreviewCallableParams): React.ReactElement;
}
interface EmbedPluginConfig {
    type: string;
    toolbar?: {
        title?: string;
        group?: string;
        preview?: () => React.ReactNode;
    };
    render?: EmbedPluginConfigRenderCallable;
    oembed?: {
        global?: keyof Window;
        sdk?: string;
        // onData?: Function;
        onData?: (data: { [key: string]: any }) => { [key: string]: any };
        renderEmbed?: (props: OEmbedProps) => React.ReactElement;
        init?: (params: { node: HTMLElement }) => void;
    };
    settings?: Array<string | Array<string | any>> | Function;
    create?: Function;
    target?: Array<string>;
    onCreate?: OnCreateActions;
    renderElementPreview?: EmbedPluginConfigRenderElementPreviewCallable;
}

export const createEmbedPlugin = (config: EmbedPluginConfig): PbEditorPageElementPlugin => {
    const defaultSettings = ["pb-editor-page-element-settings-delete"];

    return {
        name: "pb-editor-page-element-" + config.type,
        type: "pb-editor-page-element",
        elementType: config.type,
        toolbar: config.toolbar,
        settings:
            typeof config.settings === "function"
                ? config.settings(defaultSettings)
                : defaultSettings,
        target: config.target || ["cell", "block", "list-item"],
        // eslint-disable-next-line
        create({ content = {}, ...options }) {
            const defaultValue: Partial<PbEditorElement> = {
                type: config.type,
                elements: [],
                data: {
                    settings: {
                        margin: createInitialPerDeviceSettingValue(
                            { all: "0px" },
                            DisplayMode.DESKTOP
                        ),
                        padding: createInitialPerDeviceSettingValue(
                            { all: "0px" },
                            DisplayMode.DESKTOP
                        )
                    }
                },
                ...options
            };

            return typeof config.create === "function" ? config.create(defaultValue) : defaultValue;
        },
        render(props) {
            if (config.render) {
                return config.render(props);
            }

            return <OEmbed element={props.element} {...(config.oembed || {})} />;
        },
        onCreate: config.onCreate || OnCreateActions.OPEN_SETTINGS,
        renderElementPreview: config.renderElementPreview
    };
};

type EmbedPluginSidebarConfig = {
    type: string;
    render: PbEditorPageElementAdvancedSettingsPlugin["render"];
};

export const createEmbedSettingsPlugin = ({
    type,
    render
}: EmbedPluginSidebarConfig): PbEditorPageElementAdvancedSettingsPlugin => {
    return {
        name: "pb-editor-page-element-advanced-settings-" + type,
        type: "pb-editor-page-element-advanced-settings",
        elementType: type,
        render
    };
};
