import { Node } from "./Node";
import type { NodeFormatted } from "~/Tree/domains/NodeFormatted";
import type { NodeDto } from "~/Tree/domains/NodeDto";

export class NodeFormatter {
    static toFormatted<TData = unknown>(item: Node<TData>): NodeFormatted<TData> {
        return {
            id: item.id,
            text: item.text,
            parent: item.parentId,
            droppable: item.droppable ?? true,
            data: item.data,
            icon: item.icon
        };
    }

    static toDto<TData = unknown>(item: Node<TData>): NodeDto<TData> {
        return {
            id: item.id,
            text: item.text,
            parentId: item.parentId,
            droppable: item.droppable,
            data: item.data,
            icon: item.icon
        };
    }
}
