export type NodeFormattedDefaultData = {
    id: string;
    label: string;
    parentId: string;
    droppable: boolean;
    active: boolean;
    loading: boolean;
};

export type WithDefaultNodeData<T> = NodeFormattedDefaultData & T;

export interface NodeFormatted<TData = Record<string, any>> {
    id: string;
    text: string;
    parent: string;
    droppable: boolean;
    data: WithDefaultNodeData<TData>;
}
