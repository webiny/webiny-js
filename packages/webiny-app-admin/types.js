// @flow
import type { Node } from "react";
import type { PluginType } from "webiny-app/types";

export type ContentPlugin = PluginType & {
    render: ({ content: Node }) => {}
};

export type SearchPlugin = PluginType & {
    type: "global-search",
    label: string,
    route: string,
    search: {
        operator?: "and" | "or",
        fields?: Array<string>
    }
};
