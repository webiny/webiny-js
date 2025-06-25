import { Node } from "./Node";
import type { NodeFormatted } from "~/Tree/domains/NodeFormatted";
import type { NodeDto } from "~/Tree/domains/NodeDto";

export class NodeFormatter {
    static toFormatted(item: Node): NodeFormatted {
        return {
            id: item.id,
            text: item.text,
            parent: item.parentId,
            droppable: item.droppable ?? true,
            data: item.data
        };
    }

    static toDto(item: Node): NodeDto {
        return {
            id: item.id,
            text: item.text,
            parentId: item.parentId,
            droppable: item.droppable,
            data: item.data
        };
    }
}
