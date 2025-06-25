import type { ReactElement } from "react";

export interface NodeFormatted<TData = unknown> {
    id: string;
    text: string;
    parent: string;
    droppable: boolean;
    data: TData;
    icon?: ReactElement;
}
