// @flow
import type { Node, ComponentType } from "react";
import type { PluginType } from "webiny-app/types";

export type ContentPlugin = PluginType & {
    render: ({ content: Node }) => {}
};

export type SearchPlugin = PluginType & {
    labels: {
        option: string,
        search: string
    },
    renderFilters?: ({ Bind: ComponentType<*> }) => Node,
    onSearch?: (data: Object) => void
};
