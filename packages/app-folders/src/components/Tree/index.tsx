import React, { useState } from "react";

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
import useDeepCompareEffect from "use-deep-compare-effect";

import { useFolders } from "~/hooks/useFolders";

import { CreateButton } from "./ButtonCreate";
import { Node } from "./Node";
import { NodePreview } from "./NodePreview";
import { Placeholder } from "./Placeholder";
import { Title } from "./Title";
import { FolderDialogCreate, FolderDialogDelete, FolderDialogUpdate } from "~/components";

import { Container } from "./styled";

import { DndItemData, FolderItem } from "~/types";

const ROOT_ID = "root";

const createTreeData = (
    folders: FolderItem[] = [],
    focusedNodeId?: string
): NodeModel<DndItemData>[] => {
    return folders.map(item => {
        const { id, parentId, name, slug, type, createdOn, createdBy } = item;

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
                createdOn,
                createdBy,
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
            if (curr.parentId && acc.some(el => el === curr?.id)) {
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
    onTitleClick?: (event: React.MouseEvent<HTMLElement>) => void;
    focusedFolderId?: string;
};

export const FolderTree: React.FC<Props> = ({
    type,
    title,
    focusedFolderId,
    onFolderClick,
    onTitleClick
}) => {
    const { folders, updateFolder } = useFolders(type);
    const [treeData, setTreeData] = useState<NodeModel<DndItemData>[]>([]);
    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [initialOpenList, setInitialOpenList] = useState<undefined | InitialOpen>(undefined);
    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();
    const { showSnackbar } = useSnackbar();

    useDeepCompareEffect(() => {
        if (folders) {
            setTreeData(createTreeData(folders, focusedFolderId));
            setInitialOpenList(createInitialOpenList(folders, focusedFolderId));
        }
    }, [Object.assign({}, folders), focusedFolderId]);

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

    const sort = (a: NodeModel<DndItemData>, b: NodeModel<DndItemData>) => {
        if (a.data!.name > b.data!.name) {
            return 1;
        }

        if (a.data!.name < b.data!.name) {
            return -1;
        }

        return 0;
    };

    return (
        <Container>
            <Title title={title} onClick={onTitleClick} />

            {folders && folders.length > 0 && (
                <DndProvider backend={MultiBackend} options={getBackendOptions()}>
                    <Tree
                        tree={treeData}
                        rootId={ROOT_ID}
                        onDrop={handleDrop}
                        sort={sort}
                        render={(node, { depth, isOpen, onToggle }) => (
                            <Node
                                node={node}
                                depth={depth}
                                isOpen={isOpen}
                                onToggle={onToggle}
                                onClick={data => onFolderClick(data)}
                                onUpdateFolder={data => {
                                    setSelectedFolder(data);
                                    setUpdateDialogOpen(true);
                                }}
                                onDeleteFolder={data => {
                                    setSelectedFolder(data);
                                    setDeleteDialogOpen(true);
                                }}
                            />
                        )}
                        dragPreviewRender={monitorProps => (
                            <NodePreview monitorProps={monitorProps} />
                        )}
                        classes={{
                            root: "treeRoot",
                            dropTarget: "dropTarget",
                            draggingSource: "draggingSource",
                            placeholder: "placeholderContainer"
                        }}
                        initialOpen={initialOpenList}
                        placeholderRender={(node, { depth }) => (
                            <Placeholder node={node} depth={depth} />
                        )}
                    />
                </DndProvider>
            )}

            <CreateButton onClick={() => setCreateDialogOpen(true)} />
            <FolderDialogCreate
                type={type}
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                parentId={undefined}
            />
            {selectedFolder && (
                <>
                    <FolderDialogUpdate
                        folder={selectedFolder}
                        open={updateDialogOpen}
                        onClose={() => {
                            setUpdateDialogOpen(false);
                            setSelectedFolder(undefined);
                        }}
                    />
                    <FolderDialogDelete
                        folder={selectedFolder}
                        open={deleteDialogOpen}
                        onClose={() => {
                            setDeleteDialogOpen(false);
                            setSelectedFolder(undefined);
                        }}
                    />
                </>
            )}
        </Container>
    );
};
