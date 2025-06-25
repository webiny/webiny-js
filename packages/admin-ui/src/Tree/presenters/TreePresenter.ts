import { makeAutoObservable } from "mobx";
import { Node, type NodeFormatted, type NodeParams, NodeFormatter } from "../domains";

interface TreePresenterInitParams {
    nodes?: NodeParams[];
    rootId?: string;
    defaultOpenNodesIds?: string[];
}

interface ITreePresenter {
    init: (params: TreePresenterInitParams) => void;
    handleDrop: (newTree: Node[]) => Promise<void>;
    vm: {
        nodes: NodeFormatted[];
        rootId: string;
        openNodesId: string[];
    };
}

class TreePresenter implements ITreePresenter {
    private nodes: Node[] = [];
    private openNodesId: string[] = [];
    private rootId: string = "";

    constructor() {
        makeAutoObservable(this);
    }

    get vm() {
        return {
            nodes: this.nodes.map(item => NodeFormatter.toFormatted(item)),
            openNodesId: this.openNodesId,
            rootId: this.rootId
        };
    }

    public init(params: TreePresenterInitParams) {
        this.nodes = (params.nodes ?? []).map(item => Node.create(item));
        this.openNodesId = params.defaultOpenNodesIds ?? [];
        this.rootId = params.rootId ?? "0";
    }

    public handleDrop = async (newTree: Node[]): Promise<void> => {
        const oldNodes = [...this.nodes];

        try {
            // Update the nodes based on the new tree structure
            this.nodes = newTree.map(item =>
                Node.create({
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
