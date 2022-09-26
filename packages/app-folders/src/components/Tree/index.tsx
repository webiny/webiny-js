import React, { useEffect, useState } from "react";

import {
    Tree,
    getBackendOptions,
    MultiBackend,
    NodeModel,
    DropOptions
} from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";

import { useListFolders, useUpdateFolder } from "~/hooks";

import { Node } from "./Node";
import { NodePreview } from "./NodePreview";
import { Title } from "./Title";

import { Container } from "./styled";

import { FolderItem, DndItemData, Types } from "~/types";

const handleData = (data: FolderItem[], focusedNodeId: string): NodeModel<DndItemData>[] => {
    return data.map(({ id, parentId, name }) => ({
        id,
        parent: parentId || "root",
        text: name,
        droppable: true,
        data: {
            isFocused: focusedNodeId === id
        }
    }));
};

type Props = {
    type: keyof Types;
    focusedNodeId: string;
};

export const FolderTree: React.FC<Props> = ({ type, focusedNodeId }) => {
    const [treeData, setTreeData] = useState<NodeModel<DndItemData>[]>([]);

    const { folders, loading: listLoading } = useListFolders(type);
    const { update } = useUpdateFolder();

    const handleDrop = async (
        newTree: NodeModel<DndItemData>[],
        { dragSourceId, dropTargetId }: DropOptions
    ) => {
        setTreeData(newTree);
        await update({
            variables: {
                id: dragSourceId,
                data: { parentId: !!dropTargetId ? dropTargetId : null }
            }
        });
    };

    useEffect(() => {
        if (!listLoading) {
            const newData = handleData(folders, focusedNodeId);
            setTreeData(newData);
        }
    }, [folders, listLoading]);

    const onNodeClick = (id: any) => {
        console.log("hello", id);
    };

    return (
        <Container>
            <Title type={type} />
            <DndProvider backend={MultiBackend} options={getBackendOptions()}>
                <Tree
                    tree={treeData}
                    rootId={"root"}
                    onDrop={handleDrop}
                    sort={false}
                    render={(node, { depth, isOpen, onToggle }) => (
                        <Node
                            node={node}
                            depth={depth}
                            isOpen={isOpen}
                            onToggle={onToggle}
                            onClick={onNodeClick}
                        />
                    )}
                    dragPreviewRender={monitorProps => <NodePreview monitorProps={monitorProps} />}
                    classes={{
                        root: "treeRoot",
                        dropTarget: "dropTarget"
                    }}
                />
            </DndProvider>
        </Container>
    );
};
