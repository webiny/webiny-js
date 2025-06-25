export interface NodeDto {
    id: string;
    text: string;
    parentId: string;
    droppable?: boolean;
    data?: unknown;
}
