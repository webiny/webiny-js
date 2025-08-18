import { makeAutoObservable } from "mobx";
import { Node, type NodeFormatted, type NodeParams, NodeFormatter } from "../domains";

interface TreePresenterInitParams {
    rootId?: string;
    defaultOpenNodeIds?: string[];
    defaultLockedOpenNodeIds?: string[];
    loadingNodeIds?: string[];
}

interface ITreePresenter<TData = unknown> {
    init: (params: TreePresenterInitParams) => void;
    initNodes: (nodes?: NodeParams<TData>[]) => void;
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
    private loadingNodeIds: string[] = [];
    private rootId: string = "";

    constructor() {
        makeAutoObservable(this);
    }

    get vm() {
        return {
            nodes: this.nodes.map(item =>
                NodeFormatter.toFormatted<TData>(item, this.loadingNodeIds)
            ),
            openNodeIds: this.openNodeIds,
            lockedOpenNodeIds: this.lockedOpenNodeIds,
            loadingNodeIds: this.loadingNodeIds,
            rootId: this.rootId
        };
    }

    public init(params: TreePresenterInitParams) {
        this.openNodeIds = params.defaultOpenNodeIds ?? [];
        this.lockedOpenNodeIds = params.defaultLockedOpenNodeIds ?? [];
        this.loadingNodeIds = params.loadingNodeIds ?? [];
        this.rootId = params.rootId ?? "0";
    }

    public initNodes(nodes?: NodeParams<TData>[]) {
        this.nodes = (nodes ?? []).map(item => Node.create<TData>(item));
    }

    public handleDrop = async (newTree: NodeParams<TData>[]): Promise<void> => {
        const oldNodes = [...this.nodes];

        try {
            // Update the nodes based on the new tree structure
            this.nodes = newTree.map(item =>
                Node.create<TData>({
                    id: String(item.id),
                    label: item.label,
                    parentId: String(item.parentId),
                    droppable: item.droppable,
                    data: item.data
                })
            );
        } catch {
            this.nodes = [...oldNodes]; // Revert to old nodes in case of error
        }
    };
}

export { TreePresenter, type TreePresenterInitParams };
