import { makeAutoObservable } from "mobx";
import { Node, type NodeFormatted, type NodeParams, NodeFormatter } from "../domains";

interface TreePresenterInitParams<TData = unknown> {
    nodes?: NodeParams<TData>[];
    rootId?: string;
    defaultOpenNodeIds?: string[];
    defaultLockedOpenNodeIds?: string[];
    loadingNodeIds?: string[];
}

interface ITreePresenter<TData = unknown> {
    init: (params: TreePresenterInitParams<TData>) => void;
    handleDrop: (newTree: Node<TData>[]) => Promise<void>;
    vm: {
        nodes: NodeFormatted<TData>[];
        rootId: string;
        openNodeIds: string[];
        lockedOpenNodeIds?: string[];
        loadingNodeIds?: string[];
    };
}

class TreePresenter<TData = unknown> implements ITreePresenter<TData> {
    private nodes: Node<TData>[] = [];
    private openNodeIds: string[] = [];
    private lockedOpenNodeIds: string[] = [];
    private rootId: string = "";

    constructor() {
        makeAutoObservable(this);
    }

    get vm() {
        return {
            nodes: this.nodes.map(item => NodeFormatter.toFormatted<TData>(item)),
            openNodeIds: this.openNodeIds,
            lockedOpenNodeIds: this.lockedOpenNodeIds,
            rootId: this.rootId
        };
    }

    public init(params: TreePresenterInitParams<TData>) {
        this.nodes = (params.nodes ?? []).map(item => Node.create<TData>(item));
        this.openNodeIds = params.defaultOpenNodeIds ?? [];
        this.lockedOpenNodeIds = params.defaultLockedOpenNodeIds ?? [];
        this.rootId = params.rootId ?? "0";
    }

    public handleDrop = async (newTree: Node<TData>[]): Promise<void> => {
        const oldNodes = [...this.nodes];

        try {
            // Update the nodes based on the new tree structure
            this.nodes = newTree.map(item =>
                Node.create<TData>({
                    id: String(item.id),
                    label: item.label,
                    parentId: String(item.parentId),
                    droppable: item.droppable,
                    active: item.active,
                    loading: item.loading,
                    data: item.data
                })
            );
        } catch (error) {
            this.nodes = [...oldNodes]; // Revert to old nodes in case of error
        }
    };
}

export { TreePresenter, type TreePresenterInitParams };
