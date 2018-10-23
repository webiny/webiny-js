// @flow
import type { Node } from "react";
import type { Plugin } from "webiny-app/types";

export type ContentPlugin = Plugin & {
    render: ({ content: Node }) => {}
};

export type SearchPlugin = Plugin & {
    type: "global-search",
    label: string,
    route: string,
    search: {
        operator?: "and" | "or",
        fields?: Array<string>
    }
};
