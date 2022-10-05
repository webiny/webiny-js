import React, { useEffect, useState } from "react";

import {
    DropOptions,
    getBackendOptions,
    InitialOpen,
    MultiBackend,
    NodeModel,
    Tree
} from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";

import { useFolders } from "~/hooks/useFolders";
import { useListFolders } from "~/hooks/useListFolders";
import { useUpdateFolder } from "~/hooks/useUpdateFolder";

import { Node } from "./Node";
import { NodePreview } from "./NodePreview";
import { Title } from "./Title";

import { Container } from "./styled";

import { DndItemData, FolderItem } from "~/types";
import { CreateButton } from "~/components/Tree/ButtonCreate";
import { CreateDialog } from "~/components/Tree/DialogCreate";

const createTreeData = (
    folders: FolderItem[] = [],
    focusedNodeId?: string
): NodeModel<DndItemData>[] => {
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
    const { folders: foldersData } = useFolders();
    const { listFolders } = useListFolders();
    const { updateFolder } = useUpdateFolder();
    const [folders, setFolders] = useState<undefined | FolderItem[]>(undefined);
    const [treeData, setTreeData] = useState<NodeModel<DndItemData>[]>([]);
    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
    const [initialOpenList, setInitialOpenList] = useState<undefined | InitialOpen>(undefined);

    useEffect(() => {
        listFolders(type);
    }, []);

    useEffect(() => {
        setFolders(foldersData[type]);
    }, [foldersData]);

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
        setTreeData(newTree);
        await updateFolder(dragSourceId as string, {
            parentId: !!dropTargetId ? (dropTargetId as string) : null
        });
    };

    return (
        <Container>
            <Title title={title} />
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
                            onClick={data => onFolderClick(data)}
                        />
                    )}
                    dragPreviewRender={monitorProps => <NodePreview monitorProps={monitorProps} />}
                    classes={{
                        root: "treeRoot",
                        dropTarget: "dropTarget"
                    }}
                    initialOpen={initialOpenList}
                />
            </DndProvider>
            <CreateButton onClick={() => setCreateDialogOpen(true)} />
            <CreateDialog
                type={type}
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
            />
        </Container>
    );
};
