import type { Node, ComponentType } from "react";

// TODO: @pavel
export type EditorPlugin = {
    name: string,
    type: string,
    labels: {
        option: string,
        search: string
    },
    renderFilters?: ({ Bind: ComponentType<*> }) => Node,
    onSearch?: (data: Object) => void
};

export type ElementType = {
    id: string,
    path: string,
    type: string,
    data: Object,
    settings: Object
};