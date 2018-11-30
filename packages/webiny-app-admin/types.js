// @flow
import type { Node, ComponentType } from "react";
import type { PluginType } from "webiny-plugins/types";

export type ContentPluginType = PluginType & {
    render: ({ content: Node }) => {}
};

export type SearchPluginType = PluginType & {
    labels: {
        option: string,
        search: string
    },
    renderFilters?: ({ Bind: ComponentType<*> }) => Node,
    onSearch?: (data: Object) => void
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
