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
import { CreateButton } from "~/components/Tree/ButtonCreate";
import { CreateDialog } from "~/components/Tree/DialogCreate";

const createTreeData = (folders: FolderItem[], focusedNodeId: string): NodeModel<DndItemData>[] => {
    return folders.map(item => {
        const { id, parentId, name, slug, type } = item;

        return {
            id,
            parent: parentId || "root",
            text: name,
            droppable: true,
            data: {
                id,
                name,
                slug,
                parentId,
                type,
                isFocused: focusedNodeId === id
            }
        };
    });
};

type Props = {
    type: keyof Types;
    focusedNodeId: string;
    onNodeClick: (data: NodeModel<DndItemData>["data"]) => void;
};

export const FolderTree: React.FC<Props> = ({ type, focusedNodeId, onNodeClick }) => {
    const [treeData, setTreeData] = useState<NodeModel<DndItemData>[]>([]);
    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);

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
            const data = createTreeData(folders, focusedNodeId);
            setTreeData(data);
        }
    }, [folders, listLoading]);

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
                            onClick={data => onNodeClick(data)}
                        />
                    )}
                    dragPreviewRender={monitorProps => <NodePreview monitorProps={monitorProps} />}
                    classes={{
                        root: "treeRoot",
                        dropTarget: "dropTarget"
                    }}
                />
            </DndProvider>
            <CreateButton onClick={() => setCreateDialogOpen(true)} />
            <CreateDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                type={type}
            />
        </Container>
    );
};
