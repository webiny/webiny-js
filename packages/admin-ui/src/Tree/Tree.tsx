import React from "react";
import { getBackendOptions, MultiBackend, Tree as DndTree } from "@minoru/react-dnd-treeview";
import type { RenderParams } from "@minoru/react-dnd-treeview/dist/types";
import { DndProvider } from "react-dnd";
import { makeDecoratable, withStaticProps } from "~/utils";
import { Item } from "./components";
import type { NodeDto, WithDefaultNodeData } from "./domains";
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

export interface DropOptions<TData = Record<string, any>> {
    dragSourceId?: NodeDto<TData>["id"];
    dropTargetId: NodeDto<TData>["id"];
    dragSource?: NodeDto<TData>;
    dropTarget?: NodeDto<TData>;
}

export interface TreeProps<TData = WithDefaultNodeData<Record<string, any>>> {
    nodes: NodeDto<TData>[];
    rootId?: string;
    defaultOpenNodesIds?: string[];
    activeNodeIds?: string[];
    onDrop?: (newTree: NodeDto<TData>[], options: DropOptions<TData>) => Promise<void>;
    onChangeOpen?: (newOpenNodes: NodeDto<TData>[]) => void;
    canDrag?: (node: NodeDto<TData> | undefined) => boolean;
    canDrop?: (tree: NodeDto<TData>[], options: DropOptions<TData>) => boolean;
    renderer?: (data: WithDefaultNodeData<TData>, params: RenderParams) => React.ReactNode;
}

const BaseTree = <TData,>(props: TreeProps<TData>) => {
    const { vm, handleDrop, changeOpen, canDrag, canDrop } = useTree<TData>(props);

    return (
        <DndProvider backend={MultiBackend} options={getBackendOptions()}>
            <DndTree
                tree={vm.nodes}
                rootId={vm.rootId}
                initialOpen={vm.openNodesId}
                render={(node, params) => {
                    const data = node.data as WithDefaultNodeData<TData>;

                    if (props.renderer) {
                        const rendered = props.renderer(data, params);
                        if (React.isValidElement(rendered)) {
                            return rendered;
                        }
                        return <span />;
                    }
                    return (
                        <Item active={data.active}>
                            <Item.Content onClick={params.onToggle}>{data.label}</Item.Content>
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

export { Tree };
