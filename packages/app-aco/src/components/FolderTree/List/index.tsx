import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { Node } from "../Node";
import { NodePreview } from "../NodePreview";
import { Placeholder } from "../Placeholder";
import { createInitialOpenList, createTreeData } from "./utils";
import { useFolders } from "~/hooks";
import { ROOT_FOLDER } from "~/constants";
import { DndFolderItemData, FolderItem } from "~/types";
import { FolderProvider } from "~/contexts/folder";

interface ListProps {
    folders: FolderItem[];
    focusedFolderId?: string;
    hiddenFolderIds?: string[];
    enableActions?: boolean;
    onFolderClick: (data: FolderItem) => void;
}

export const List = ({
    folders,
    onFolderClick,
    focusedFolderId,
    hiddenFolderIds,
    enableActions
}: ListProps) => {
    const { updateFolder, folderLevelPermissions: flp } = useFolders();
    const { showSnackbar } = useSnackbar();
    const [treeData, setTreeData] = useState<NodeModel<DndFolderItemData>[]>([]);
    const [initialOpenList, setInitialOpenList] = useState<undefined | InitialOpen>();
    const [openFolderIds, setOpenFolderIds] = useState<string[]>([ROOT_FOLDER]);

    useEffect(() => {
        if (folders) {
            setTreeData(createTreeData(folders, focusedFolderId, hiddenFolderIds));
        }
    }, [folders, focusedFolderId]);

    useEffect(() => {
        if (!folders) {
            return;
        }
        setInitialOpenList(createInitialOpenList(folders, openFolderIds, focusedFolderId));
    }, [focusedFolderId]);

    const handleDrop = async (
        newTree: NodeModel<DndFolderItemData>[],
        { dragSourceId, dropTargetId }: DropOptions
    ) => {
        // Store the current state of the tree before the drop action
        const oldTree = [...treeData];
        try {
            const item = folders.find(folder => folder.id === dragSourceId);

            if (!item) {
                throw new Error("Folder not found!");
            }

            setTreeData(newTree);

            await updateFolder({
                ...item,
                parentId: dropTargetId !== ROOT_FOLDER ? (dropTargetId as string) : null
            });
        } catch (error) {
            // If an error occurs, revert the tree back to its original state
            setTreeData(oldTree);
            return showSnackbar(error.message);
        }
    };

    const sort = useMemo(
        () => (a: NodeModel<DndFolderItemData>, b: NodeModel<DndFolderItemData>) => {
            if (a.id === ROOT_FOLDER || b.id === ROOT_FOLDER) {
                return 1;
            }
            return a.text.localeCompare(b.text, undefined, { numeric: true });
        },
        []
    );

    const handleChangeOpen = (folderIds: string[]) => {
        setOpenFolderIds([ROOT_FOLDER, ...folderIds]);
    };

    const canDrag = useCallback(
        (folderId: string) => {
            const isRootFolder = folderId === ROOT_FOLDER;
            return !isRootFolder && flp.canManageStructure(folderId);
        },
        [flp.canManageStructure]
    );

    return (
        <>
            <DndProvider backend={MultiBackend} options={getBackendOptions()} context={window}>
                <Tree
                    tree={treeData}
                    rootId={"0"}
                    onDrop={handleDrop}
                    onChangeOpen={ids => handleChangeOpen(ids as string[])}
                    sort={sort}
                    canDrag={item => canDrag(item!.id as string)}
                    render={(node, { depth, isOpen, onToggle }) => {
                        const folder = folders.find(folder => folder.id === node.id);

                        return (
                            <FolderProvider folder={folder}>
                                <Node
                                    node={node}
                                    depth={depth}
                                    isOpen={isOpen}
                                    enableActions={enableActions}
                                    onToggle={onToggle}
                                    onClick={data => onFolderClick(data)}
                                />
                            </FolderProvider>
                        );
                    }}
                    dragPreviewRender={monitorProps => <NodePreview monitorProps={monitorProps} />}
                    classes={{
                        dropTarget: "dropTarget",
                        draggingSource: "draggingSource",
                        placeholder: "placeholderContainer"
                    }}
                    initialOpen={initialOpenList}
                    placeholderRender={(_, { depth }) => <Placeholder depth={depth} />}
                />
            </DndProvider>
        </>
    );
};
