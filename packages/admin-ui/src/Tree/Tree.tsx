import React from "react";
import { getBackendOptions, MultiBackend, Tree as DndTree } from "@minoru/react-dnd-treeview";
import type { RenderParams } from "@minoru/react-dnd-treeview/dist/types";
import { DndProvider } from "react-dnd";
import { makeDecoratable, withStaticProps } from "~/utils";
import { Item } from "./components";
import type { NodeDto, WithDefaultNodeData } from "./domains";
import { useTree } from "./useTree";

export interface DropOptions<TData = Record<string, any>> {
    dragSourceId?: NodeDto<TData>["id"];
    dropTargetId: NodeDto<TData>["id"];
    dragSource?: NodeDto<TData>;
    dropTarget?: NodeDto<TData>;
}

export interface TreeProps<TData = Record<string, any>> {
    nodes: NodeDto<TData>[];
    rootId?: string;
    defaultOpenNodeIds?: string[];
    defaultLockedOpenNodeIds?: string[];
    loadingNodeIds?: string[];
    onChangeOpen?: (newOpenNodes: NodeDto<TData>[]) => void;
    onDrop?: (newTree: NodeDto<TData>[], options: DropOptions<TData>) => Promise<void>;
    onNodeClick?: (node: WithDefaultNodeData<TData>) => void;
    canDrag?: (node: NodeDto<TData>) => boolean;
    canDrop?: (tree: NodeDto<TData>[], options: DropOptions<TData>) => boolean;
    renderer?: (node: WithDefaultNodeData<TData>, params: RenderParams) => React.ReactNode;
    sort?: (a: NodeDto<TData>, b: NodeDto<TData>) => number;
}

interface RenderTreeNodeParams<TData> {
    node: WithDefaultNodeData<TData>;
    params: RenderParams;
    renderer?: TreeProps<TData>["renderer"];
}

function renderTreeNode<TData>({ node, params, renderer }: RenderTreeNodeParams<TData>) {
    const rendered = renderer?.(node, params);

    if (rendered && React.isValidElement(rendered)) {
        return rendered;
    }

    return node.label;
}

const BaseTree = <TData,>(props: TreeProps<TData>) => {
    const { vm, handleDrop, changeOpen, canDrag, canDrop, sort } = useTree<TData>(props);

    return (
        <DndProvider backend={MultiBackend} options={getBackendOptions()}>
            <DndTree
                tree={vm.nodes}
                rootId={vm.rootId}
                initialOpen={vm.openNodeIds}
                render={(node, params) => {
                    const nodeData = node.data as WithDefaultNodeData<TData>;

                    // Indentation logic: increase padding by 20 px per level with a base of 10 px
                    const indent = 10 + params.depth * 20;

                    return (
                        <Item
                            active={nodeData.active}
                            loading={nodeData.loading}
                            style={{ paddingInlineStart: indent }}
                        >
                            {!vm.lockedOpenNodeIds.includes(nodeData.id) && (
                                <Tree.Item.CollapseTrigger
                                    open={params.isOpen}
                                    loading={nodeData.loading}
                                    onClick={params.onToggle}
                                />
                            )}

                            <Item.Content
                                onClick={() => {
                                    if (props.onNodeClick) {
                                        props.onNodeClick(nodeData);
                                    }
                                }}
                            >
                                {renderTreeNode({
                                    node: nodeData,
                                    params,
                                    renderer: props.renderer
                                })}
                            </Item.Content>

                            {params.draggable && (
                                <Tree.Item.DragHandle handleRef={params.handleRef} />
                            )}
                        </Item>
                    );
                }}
                onDrop={handleDrop}
                onChangeOpen={changeOpen}
                canDrag={canDrag}
                canDrop={canDrop}
                classes={{
                    dropTarget: "wby-bg-neutral-dark/5",
                    draggingSource: "wby-opacity-50",
                    placeholder: "wby-relative"
                }}
                sort={sort}
            />
        </DndProvider>
    );
};

const DecoratableTree = makeDecoratable("Tree", BaseTree);

const Tree = withStaticProps(DecoratableTree, {
    Item
});

export { Tree };
