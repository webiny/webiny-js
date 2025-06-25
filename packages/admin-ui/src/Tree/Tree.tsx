import React from "react";
import { getBackendOptions, MultiBackend, Tree as DndTree } from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";
import { makeDecoratable, withStaticProps } from "~/utils";
import { Item } from "./components";
import type { NodeDto } from "./domains";
import { useTree } from "./useTree";

// export type RenderParams = {
//     depth: number;
//     isOpen: boolean;
//     isDragging: boolean;
//     isDropTarget: boolean;
//     draggable: boolean;
//     hasChild: boolean;
//     containerRef: RefObject<HTMLElement | null>;
//     handleRef: RefObject<HTMLDivElement | null>;
//     onToggle: () => void;
// };

interface DropOptions {
    dragSourceId?: NodeDto["id"];
    dropTargetId: NodeDto["id"];
    dragSource?: NodeDto;
    dropTarget?: NodeDto;
}

interface TreeProps {
    nodes: NodeDto[];
    rootId?: string;
    defaultOpenNodesIds?: string[];
    activeNodeIds?: string[];
    onDrop?: (newTree: NodeDto[], options: DropOptions) => Promise<void>;
    onChangeOpen?: (newOpenNodes: NodeDto[]) => void;
    canDrag?: (node: NodeDto | undefined) => boolean;
    canDrop?: (tree: NodeDto[], options: DropOptions) => boolean;
}

const BaseTree = (props: TreeProps) => {
    const { vm, handleDrop, changeOpen, canDrag, canDrop } = useTree(props);

    return (
        <DndProvider backend={MultiBackend} options={getBackendOptions()}>
            <DndTree
                tree={vm.nodes}
                rootId={vm.rootId}
                initialOpen={vm.openNodesId}
                render={(node, params) => {
                    console.log("params", params);

                    return (
                        <Item active={true}>
                            <Item.Content onClick={params.onToggle}>{node.text}</Item.Content>
                        </Item>
                    );
                }}
                onDrop={handleDrop}
                onChangeOpen={changeOpen}
                canDrag={canDrag}
                canDrop={canDrop}
            />
        </DndProvider>
    );
};

const DecoratableTree = makeDecoratable("Tree", BaseTree);

const Tree = withStaticProps(DecoratableTree, {
    Item
});

export { Tree, type TreeProps, type DropOptions };
