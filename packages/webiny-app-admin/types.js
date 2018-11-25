// @flow
import * as React from "react";
import type { PluginType } from "webiny-app/types";

export type ContentPluginType = PluginType & {
    render: ({ content: React.Node }) => {}
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
    render: ({ content: React.Node }) => {}
};

export type SettingsPluginType = PluginType & {
    title: string,
    description: string,
    icon: React.Node,
    render: () => React.Node
};
