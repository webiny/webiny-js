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

import { useFolders, useListFolders, useUpdateFolder } from "~/hooks";

import { Node } from "./Node";
import { NodePreview } from "./NodePreview";
import { Title } from "./Title";

import { Container } from "./styled";

import { DndItemData, FolderItem, Types } from "~/types";
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
    type: keyof Types;
    focusedNodeId?: string;
    onNodeClick: (data: NodeModel<DndItemData>["data"]) => void;
};

export const FolderTree: React.FC<Props> = ({ type, focusedNodeId, onNodeClick }) => {
    const { setFolderType } = useFolders();
    const [treeData, setTreeData] = useState<NodeModel<DndItemData>[]>([]);
    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
    const [initialOpenList, setInitialOpenList] = useState<undefined | InitialOpen>(undefined);

    const { folders } = useListFolders();
    const { updateFolder } = useUpdateFolder();

    const handleDrop = async (
        newTree: NodeModel<DndItemData>[],
        { dragSourceId, dropTargetId }: DropOptions
    ) => {
        setTreeData(newTree);
        await updateFolder({
            variables: {
                id: dragSourceId,
                data: { parentId: !!dropTargetId ? dropTargetId : null }
            }
        });
    };

    useEffect(() => {
        if (type) {
            setFolderType(type);
        }
        return () => {
            setFolderType(null);
        };
    }, [type]);

    useEffect(() => {
        if (folders) {
            const data = createTreeData(folders, focusedNodeId);
            setTreeData(data);
        }
    }, [folders]);

    useEffect(() => {
        if (folders) {
            const list = createInitialOpenList(folders, focusedNodeId);
            setInitialOpenList(list);
        }
    }, [folders]);

    return (
        <Container>
            <Title />
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
                    initialOpen={initialOpenList}
                />
            </DndProvider>
            <CreateButton onClick={() => setCreateDialogOpen(true)} />
            <CreateDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />
        </Container>
    );
};
