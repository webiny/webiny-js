// @flow
import type { Node, Element } from "react";
import type { PluginType } from "webiny-plugins/types";

export type ContentPluginType = PluginType & {
    render: ({ content: Node }) => {}
};

export type GlobalSearch = PluginType & {
    label: string,
    route: string,
    search?: {
        operator?: "and" | "or",
        fields?: Array<string>
    }
};

export type HeaderMiddlePlugin = PluginType & {
    render: ({ content: Node }) => {}
};

export type SettingsPluginType = PluginType & {
    settings: {
        type?: "app" | "integration" | "other",
        component: Element<any>,
        route: {
            name: string,
            path: string,
            title: string,
            group?: Object
        }
    }
};
