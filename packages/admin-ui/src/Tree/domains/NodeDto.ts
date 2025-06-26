export interface NodeDto<TData = Record<string, any>> {
    id: string;
    label: string;
    parentId: string;
    droppable?: boolean;
    active?: boolean;
    loading?: boolean;
    data?: TData;
}
