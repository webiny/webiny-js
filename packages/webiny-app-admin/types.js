// @flow
import type { Node, ComponentType } from "react";
import type { Plugin } from "webiny-app/types";

export type ContentPlugin = Plugin & {
    render: ({ content: Node }) => {}
};

export type SearchPlugin = Plugin & {
    labels: {
        option: string,
        search: string
    },
    renderFilters?: ({ Bind: ComponentType<*> }) => Node,
    onSearch?: (data: Object) => void
};
