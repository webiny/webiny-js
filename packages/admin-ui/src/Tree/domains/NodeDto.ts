import type { ReactElement } from "react";

export interface NodeDto<TData = unknown> {
    id: string;
    text: string;
    parentId: string;
    droppable?: boolean;
    data?: TData;
    icon?: ReactElement;
}
