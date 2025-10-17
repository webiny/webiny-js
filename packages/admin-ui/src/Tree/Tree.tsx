import React from "react";
import {
    getBackendOptions,
    MultiBackend,
    Tree as DndTree,
    useDragOver,
    type PlaceholderRender,
    type NodeModel,
    type RenderParams
} from "@minoru/react-dnd-treeview";

import { DndProvider, type DragSourceMonitor } from "react-dnd";
import { makeDecoratable, withStaticProps } from "~/utils.js";
import { Item } from "./components/index.js";
import type { NodeDto, WithDefaultNodeData } from "./domains/index.js";
import { useTree } from "./useTree.js";

export interface DropOptions<TData = Record<string, any>> {
    dragSourceId?: NodeDto<TData>["id"];
    dropTargetId: NodeDto<TData>["id"];
    dragSource?: NodeDto<TData>;
    dropTarget?: NodeDto<TData>;
}

export interface TreeProps<TData = Record<string, any>> {
    autoExpandOnDragOver?: boolean;
    canDrag?: (node: NodeDto<TData>) => boolean;
    canDrop?: (tree: NodeDto<TData>[], options: DropOptions<TData>) => boolean;
    defaultLockedOpenNodeIds?: string[];
    defaultOpenNodeIds?: string[];
    dropTargetOffset?: number;
    insertDroppableFirst?: boolean;
    loadingNodeIds?: string[];
    nodes: NodeDto<TData>[];
    onChangeOpen?: (newOpenNodes: NodeDto<TData>[]) => void;
    onDragStart?: (node: NodeModel<NodeDto<TData>>, monitor: DragSourceMonitor) => void;
    onDrop?: (newTree: NodeDto<TData>[], options: DropOptions<TData>) => Promise<void> | void;
    onNodeClick?: (node: WithDefaultNodeData<TData>) => void;
    placeholderRender?: PlaceholderRender<NodeDto<TData>>;
    renderer?: (node: WithDefaultNodeData<TData>, params?: RenderParams) => React.ReactNode;
    rootId?: string;
    sort?: boolean | ((a: NodeDto<TData>, b: NodeDto<TData>) => number);
}

interface RenderTreeNodeParams<TData> {
    node: WithDefaultNodeData<TData>;
    params?: RenderParams;
    renderer?: TreeProps<TData>["renderer"];
}

const ListComponent = React.forwardRef(({ children, className = "", ...props }: any, ref) => {
    const classNames = [...className.split(" "), "wby-pt-1"].join(" ");

    return (
        <ul ref={ref} {...props} className={classNames}>
            {children}
        </ul>
    );
});

ListComponent.displayName = "ListComponent";

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
                listComponent={ListComponent}
                insertDroppableFirst={props.insertDroppableFirst}
                render={(node, params) => {
                    const nodeData = node.data as WithDefaultNodeData<TData>;

                    // Indentation logic: increase padding by 20 px per level with a base of 10 px
                    const indent = 10 + params.depth * 20;

                    // Use the drag over hook to handle drag and drop interactions
                    const dragOverProps = useDragOver(node.id, params.isOpen, params.onToggle);

                    const itemProps = props.autoExpandOnDragOver === false ? {} : dragOverProps;

                    const onToggle = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        params.onToggle && params.onToggle();
                    };

                    const isLocked = vm.lockedOpenNodeIds.includes(nodeData.id);
                    const isCollapsable = !isLocked && node.droppable;

                    return (
                        <Item
                            active={nodeData.active}
                            loading={nodeData.loading}
                            style={{ paddingInlineStart: indent }}
                            {...itemProps}
                        >
                            {isCollapsable && (
                                <Tree.Item.CollapseTrigger
                                    open={params.isOpen}
                                    loading={nodeData.loading}
                                    onClick={onToggle}
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
                dragPreviewRender={monitorProps => (
                    <Item>
                        <Item.Content>
                            {renderTreeNode({
                                node: monitorProps.item.data as WithDefaultNodeData<TData>,
                                renderer: props.renderer
                            })}
                        </Item.Content>
                    </Item>
                )}
                dropTargetOffset={props.dropTargetOffset}
                onDragStart={props.onDragStart}
                onDrop={handleDrop}
                onChangeOpen={changeOpen}
                canDrag={canDrag}
                canDrop={canDrop}
                placeholderRender={props.placeholderRender}
                classes={{
                    dropTarget: "wby-bg-neutral-dark/5",
                    draggingSource: "wby-opacity-50 wby-bg-neutral-dimmed",
                    placeholder: "wby-relative"
                }}
                sort={typeof props.sort === "function" ? sort : props.sort}
            />
        </DndProvider>
    );
};

const DecoratableTree = makeDecoratable("Tree", BaseTree);

const Tree = withStaticProps(DecoratableTree, {
    Item
});

export { Tree, type NodeModel };
