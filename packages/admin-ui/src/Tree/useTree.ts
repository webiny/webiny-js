import { useEffect, useMemo, useState } from "react";
import { DropOptions as DndDropOptions, NodeModel } from "@minoru/react-dnd-treeview";
import { autorun } from "mobx";
import { TreePresenter, type TreePresenterInitParams } from "./presenters";
import type { DropOptions, TreeProps } from "./Tree";
import { Node, NodeFormatter } from "~/Tree/domains";

export const useTree = (props: TreeProps) => {
    const params: TreePresenterInitParams = useMemo(() => {
        return {
            nodes: props.nodes,
            rootId: props.rootId,
            defaultOpenNodesIds: props.defaultOpenNodesIds
        };
    }, [props.nodes, props.rootId, props.defaultOpenNodesIds]);

    const presenter = useMemo(() => {
        return new TreePresenter();
    }, []);

    const [vm, setVm] = useState(presenter.vm);

    useEffect(() => {
        presenter.init(params);
    }, [params, presenter]);

    useEffect(() => {
        return autorun(() => {
            setVm(presenter.vm);
        });
    }, [presenter]);

    const handleDrop = async (newTree: NodeModel[], options: DndDropOptions) => {
        const newNodeTree = newTree.map(node => {
            return Node.create({
                id: String(node.id),
                parentId: String(node.parent),
                droppable: node.droppable,
                text: node.text,
                data: node.data
            });
        });

        await presenter.handleDrop(newNodeTree);

        if (props.onDrop) {
            const { dragSourceId, dropTargetId } = options;

            const newTreeDto = newNodeTree.map(node => NodeFormatter.toDto(node));

            const dropOptions: DropOptions = {
                dragSourceId: String(dragSourceId),
                dropTargetId: String(dropTargetId),
                dragSource: newTreeDto.find(node => node.id === String(options.dragSourceId)),
                dropTarget: newTreeDto.find(node => node.id === String(options.dropTargetId))
            };

            await props.onDrop(newTreeDto, dropOptions);
        }
    };

    const changeOpen = (newOpenIds: NodeModel["id"][]) => {
        if (props.onChangeOpen) {
            const newOpenNodes = vm.nodes
                .filter(node => newOpenIds.includes(node.id))
                .map(node =>
                    NodeFormatter.toDto(
                        Node.create({
                            id: String(node.id),
                            parentId: String(node.parent),
                            droppable: node.droppable,
                            text: node.text,
                            data: node.data
                        })
                    )
                );

            props.onChangeOpen(newOpenNodes);
        }
    };

    const canDrag = (node: NodeModel | undefined) => {
        if (!node) {
            return false;
        }

        const nodeDto = NodeFormatter.toDto(
            Node.create({
                id: String(node.id),
                parentId: String(node.parent),
                droppable: node.droppable,
                text: node.text,
                data: node.data as Record<string, unknown>
            })
        );

        return props.canDrag ? props.canDrag(nodeDto) : true;
    };

    const canDrop = (tree: NodeModel[], options: DndDropOptions) => {
        if (props.canDrop) {
            const { dragSourceId, dropTargetId } = options;

            const nodeTree = tree.map(node => {
                return Node.create({
                    id: String(node.id),
                    parentId: String(node.parent),
                    droppable: node.droppable,
                    text: node.text,
                    data: node.data as Record<string, unknown>
                });
            });

            const nodeTreeDto = nodeTree.map(node => NodeFormatter.toDto(node));

            const dropOptions: DropOptions = {
                dragSourceId: String(dragSourceId),
                dropTargetId: String(dropTargetId),
                dragSource: nodeTreeDto.find(node => node.id === String(options.dragSourceId)),
                dropTarget: nodeTreeDto.find(node => node.id === String(options.dropTargetId))
            };

            return props.canDrop(nodeTreeDto, dropOptions);
        }

        return true;
    };

    return { vm, handleDrop, changeOpen, canDrag, canDrop };
};
