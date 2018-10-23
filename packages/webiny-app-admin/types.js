// @flow
import type { Node } from "react";
import type { PluginType } from "webiny-app/types";

export type ContentPlugin = PluginType & {
    render: ({ content: Node }) => {}
};

export type GlobalSearch = PluginType & {
    label: string,
    route: string,
    search: {
        operator?: "and" | "or",
        fields?: Array<string>
    }
};

export type HeaderMiddlePlugin = PluginType & {
    render: ({ content: Node }) => {}
};
