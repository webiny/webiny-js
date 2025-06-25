import { makeAutoObservable } from "mobx";
import { Node, type NodeFormatted, type NodeParams, NodeFormatter } from "../domains";

interface TreePresenterInitParams<TData = unknown> {
    nodes?: NodeParams<TData>[];
    rootId?: string;
    defaultOpenNodesIds?: string[];
}

interface ITreePresenter<TData = unknown> {
    init: (params: TreePresenterInitParams<TData>) => void;
    handleDrop: (newTree: Node<TData>[]) => Promise<void>;
    vm: {
        nodes: NodeFormatted<TData>[];
        rootId: string;
        openNodesId: string[];
    };
}

class TreePresenter<TData = unknown> implements ITreePresenter<TData> {
    private nodes: Node<TData>[] = [];
    private openNodesId: string[] = [];
    private rootId: string = "";

    constructor() {
        makeAutoObservable(this);
    }

    get vm() {
        return {
            nodes: this.nodes.map(item => NodeFormatter.toFormatted<TData>(item)),
            openNodesId: this.openNodesId,
            rootId: this.rootId
        };
    }

    public init(params: TreePresenterInitParams<TData>) {
        this.nodes = (params.nodes ?? []).map(item => Node.create<TData>(item));
        this.openNodesId = params.defaultOpenNodesIds ?? [];
        this.rootId = params.rootId ?? "0";
    }

    public handleDrop = async (newTree: Node<TData>[]): Promise<void> => {
        const oldNodes = [...this.nodes];

        try {
            // Update the nodes based on the new tree structure
            this.nodes = newTree.map(item =>
                Node.create<TData>({
                    id: String(item.id),
                    text: item.text,
                    parentId: String(item.parentId),
                    droppable: item.droppable,
                    data: item.data
                })
            );
        } catch (error) {
            this.nodes = [...oldNodes]; // Revert to old nodes in case of error
        }
    };
}

export { TreePresenter, type TreePresenterInitParams };
