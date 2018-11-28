// @flow
import * as React from "react";
import OEmbed from "webiny-app-cms/editor/components/OEmbed";
import type { ElementPluginType } from "webiny-app-cms/types";

type EmbedPluginConfig = {
    type: string,
    toolbar: {
        title: string,
        group: string,
        preview: () => React.Node
    },
    render?: (params: ?Object) => React.Node,
    oembed?: {
        global?: string,
        sdk?: string,
        onData?: Function,
        renderEmbed?: () => React.Node
    },
    settings?: Array<string>,
    target?: Array<string>,
    onCreate?: string,
    renderElementPreview?: Function
};

export const createEmbedPlugin = (config: EmbedPluginConfig): ElementPluginType => {
    return {
        name: "cms-element-" + config.type,
        type: "cms-element",
        toolbar: config.toolbar,
        settings: config.settings || ["cms-element-settings-delete", ""],
        target: config.target || ["cms-element-column", "cms-element-row", "cms-element-list-item"],
        // eslint-disable-next-line
        create({ content = {}, ...options }) {
            return {
                type: "cms-element-" + config.type,
                elements: [],
                data: {},
                settings: {},
                ...options
            };
        },
        render(props: Object) {
            if (config.render) {
                return config.render(props);
            }

            return <OEmbed element={props.element} {...config.oembed || {}} />;
        },
        onCreate: config.onCreate || "open-settings",
        renderElementPreview: config.renderElementPreview
    };
};

type EmbedPluginSidebarConfig = {
    type: string,
    render?: (params: { Bind: React.ComponentType<*> }) => React.Node
};
export const createEmbedSettingsPlugin = ({ type, render }: EmbedPluginSidebarConfig) => {
    return {
        name: "cms-element-advanced-settings-" + type,
        type: "cms-element-advanced-settings",
        element: "cms-element-" + type,
        render
    };
};
