import React, { useEffect, useState } from "react";

import {
    DropOptions,
    getBackendOptions,
    InitialOpen,
    MultiBackend,
    NodeModel,
    Tree
} from "@minoru/react-dnd-treeview";
import { useSnackbar } from "@webiny/app-admin";
import { DndProvider } from "react-dnd";

import { useFolders } from "~/hooks/useFolders";

import { CreateButton } from "./ButtonCreate";
import { CreateDialog } from "./DialogCreate";
import { Node } from "./Node";
import { NodePreview } from "./NodePreview";
import { Title } from "./Title";

import { Container } from "./styled";

import { DndItemData, FolderItem } from "~/types";

const ROOT_ID = "root";

const createTreeData = (
    folders: FolderItem[] = [],
    focusedNodeId?: string
): NodeModel<DndItemData>[] => {
    return folders.map(item => {
        const { id, parentId, name, slug, type } = item;

        return {
            id,
            parent: parentId || ROOT_ID,
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

const createInitialOpenList = (
    folders: FolderItem[] = [],
    focusedNodeId?: string
): InitialOpen | undefined => {
    const focusedFolder = folders.find(folder => {
        return folder.id === focusedNodeId;
    });

    if (!focusedNodeId || !focusedFolder?.parentId) {
        return;
    }

    const result = folders.reduce(
        (acc, curr): string[] => {
            if (curr.parentId && acc.some(el => el === curr?.parentId)) {
                acc.push(curr.parentId);
            }

            return acc;
        },
        [focusedFolder.parentId]
    );

    return [...new Set(result)];
};

type Props = {
    type: string;
    title: string;
    onFolderClick: (data: NodeModel<DndItemData>["data"]) => void;
    focusedFolderId?: string;
};

export const FolderTree: React.FC<Props> = ({ type, title, focusedFolderId, onFolderClick }) => {
    const { folders, updateFolder } = useFolders(type);
    const [treeData, setTreeData] = useState<NodeModel<DndItemData>[]>([]);
    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
    const [initialOpenList, setInitialOpenList] = useState<undefined | InitialOpen>(undefined);
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        if (folders) {
            setTreeData(createTreeData(folders, focusedFolderId));
            setInitialOpenList(createInitialOpenList(folders, focusedFolderId));
        }
    }, [folders]);

    const handleDrop = async (
        newTree: NodeModel<DndItemData>[],
        { dragSourceId, dropTargetId }: DropOptions
    ) => {
        try {
            const item = folders.find(folder => folder.id === dragSourceId);

            if (!item) {
                throw new Error("Folder not found");
            }

            setTreeData(newTree);
            await updateFolder({
                ...item,
                parentId: dropTargetId !== ROOT_ID ? (dropTargetId as string) : null
            });
        } catch (error) {
            return showSnackbar(error.message);
        }
    };

    return (
        <Container>
            <Title title={title} />
            {folders && folders.length > 0 && (
                <DndProvider backend={MultiBackend} options={getBackendOptions()}>
                    <Tree
                        tree={treeData}
                        rootId={ROOT_ID}
                        onDrop={handleDrop}
                        sort={false}
                        render={(node, { depth, isOpen, onToggle }) => (
                            <Node
                                node={node}
                                depth={depth}
                                isOpen={isOpen}
                                onToggle={onToggle}
                                onClick={data => onFolderClick(data)}
                            />
                        )}
                        dragPreviewRender={monitorProps => (
                            <NodePreview monitorProps={monitorProps} />
                        )}
                        classes={{
                            root: "treeRoot",
                            dropTarget: "dropTarget"
                        }}
                        initialOpen={initialOpenList}
                    />
                </DndProvider>
            )}

            <CreateButton onClick={() => setCreateDialogOpen(true)} />
            <CreateDialog
                type={type}
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
            />
        </Container>
    );
};
