import { useEffect, useMemo, useState } from "react";
import { DropOptions as DndDropOptions, NodeModel } from "@minoru/react-dnd-treeview";
import { autorun } from "mobx";
import { TreePresenter, type TreePresenterInitParams } from "./presenters";
import type { TreeProps, DropOptions } from "./Tree";
import { Node, NodeFormatter } from "./domains";

export const useTree = <TData = Record<string, any>>(props: TreeProps<TData>) => {
    const params: TreePresenterInitParams = useMemo(() => {
        return {
            rootId: props.rootId,
            defaultOpenNodeIds: props.defaultOpenNodeIds,
            defaultLockedOpenNodeIds: props.defaultLockedOpenNodeIds,
            loadingNodeIds: props.loadingNodeIds
        };
    }, [
        props.rootId,
        props.defaultOpenNodeIds,
        props.defaultLockedOpenNodeIds,
        props.loadingNodeIds
    ]);

    const presenter = useMemo(() => {
        return new TreePresenter<TData>();
    }, []);

    const [vm, setVm] = useState(presenter.vm);

    useEffect(() => {
        presenter.init(params);
    }, [params, presenter]);

    useEffect(() => {
        presenter.initNodes(props.nodes);
    }, [props.nodes]);

    useEffect(() => {
        return autorun(() => {
            setVm(presenter.vm);
        });
    }, [presenter]);

    const handleDrop = async (newTree: NodeModel<TData>[], options: DndDropOptions) => {
        if (options.dragSourceId === options.dropTargetId) {
            // Drag source and drop target are the same, no action taken.
            return;
        }

        const newNodeTree = newTree.map(node => {
            return Node.create<TData>({
                id: String(node.id),
                label: node.text,
                parentId: String(node.parent),
                droppable: node.droppable,
                data: node.data as TData
            });
        });

        await presenter.handleDrop(newNodeTree);

        if (props.onDrop) {
            const { dragSourceId, dropTargetId } = options;

            const newTreeDto = newNodeTree.map(node => NodeFormatter.toDto<TData>(node));

            const dropOptions: DropOptions<TData> = {
                dragSourceId: String(dragSourceId),
                dropTargetId: String(dropTargetId),
                dragSource: newTreeDto.find(node => node.id === String(options.dragSourceId)),
                dropTarget: newTreeDto.find(node => node.id === String(options.dropTargetId))
            };

            await props.onDrop(newTreeDto, dropOptions);
        }
    };

    const changeOpen = (newOpenIds: NodeModel<TData>["id"][]) => {
        if (props.onChangeOpen) {
            const newOpenNodes = vm.nodes
                .filter(node => newOpenIds.includes(node.id))
                .map(node =>
                    NodeFormatter.toDto<TData>(
                        Node.create<TData>({
                            id: String(node.id),
                            label: node.text,
                            parentId: String(node.parent),
                            droppable: node.droppable,
                            data: node.data as TData
                        })
                    )
                );

            props.onChangeOpen(newOpenNodes);
        }
    };

    const canDrag = (node: NodeModel<TData> | undefined) => {
        if (!node) {
            return false;
        }

        const nodeDto = NodeFormatter.toDto<TData>(
            Node.create<TData>({
                id: String(node.id),
                parentId: String(node.parent),
                droppable: node.droppable,
                label: node.text,
                data: node.data as TData
            })
        );

        return props.canDrag ? props.canDrag(nodeDto) : true;
    };

    const canDrop = (tree: NodeModel<TData>[], options: DndDropOptions) => {
        if (props.canDrop) {
            const { dragSourceId, dropTargetId } = options;

            const nodeTree = tree.map(node => {
                return Node.create<TData>({
                    id: String(node.id),
                    label: node.text,
                    parentId: String(node.parent),
                    droppable: node.droppable,
                    data: node.data as TData
                });
            });

            const nodeTreeDto = nodeTree.map(node => NodeFormatter.toDto<TData>(node));

            const dropOptions: DropOptions<TData> = {
                dragSourceId: String(dragSourceId),
                dropTargetId: String(dropTargetId),
                dragSource: nodeTreeDto.find(node => node.id === String(options.dragSourceId)),
                dropTarget: nodeTreeDto.find(node => node.id === String(options.dropTargetId))
            };

            return props.canDrop(nodeTreeDto, dropOptions);
        }

        return true;
    };

    const sort = (a: NodeModel<TData>, b: NodeModel<TData>): number => {
        if (typeof props.sort === "function") {
            const nodeTreeA = Node.create<TData>({
                id: String(a.id),
                label: a.text,
                parentId: String(a.parent),
                droppable: a.droppable,
                data: a.data
            });

            const nodeTreeB = Node.create<TData>({
                id: String(b.id),
                label: b.text,
                parentId: String(b.parent),
                droppable: b.droppable,
                data: b.data
            });

            return props.sort(
                NodeFormatter.toDto<TData>(nodeTreeA),
                NodeFormatter.toDto<TData>(nodeTreeB)
            );
        }

        return 0;
    };

    return { vm, handleDrop, changeOpen, canDrag, canDrop, sort };
};
