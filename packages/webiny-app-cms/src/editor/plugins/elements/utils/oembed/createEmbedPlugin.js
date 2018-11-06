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
    oembed?: {
        global?: string,
        sdk?: string,
        renderEmbed?: () => React.Node
    },
    settings?: Array<string>,
    target?: Array<string>,
    onCreate?: string
};

export const createEmbedPlugin = (config: EmbedPluginConfig): ElementPluginType => {
    return {
        name: "cms-element-" + config.type,
        type: "cms-element",
        toolbar: config.toolbar,
        settings: config.settings || ["cms-element-settings-delete", ""],
        target: config.target || ["cms-element-column", "cms-element-row", "cms-element-list-item"],
        create({ content = {}, ...options }) {
            return {
                type: "cms-element-" + config.type,
                elements: [],
                data: {},
                settings: {},
                ...options
            };
        },
        render({ element }: Object) {
            return <OEmbed element={element} {...config.oembed || {}} />;
        },
        onCreate: config.onCreate || "open-settings"
    };
};

type EmbedPluginSidebarConfig = {
    type: string,
    render?: () => React.Node
};
export const createEmbedSettingsPlugin = ({ type, render }: EmbedPluginSidebarConfig) => {
    return {
        name: "cms-element-advanced-settings-" + type,
        type: "cms-element-advanced-settings",
        element: "cms-element-" + type,
        render
    };
};
