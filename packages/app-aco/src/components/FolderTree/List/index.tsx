import React, { useEffect, useMemo, useState } from "react";
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
import {
    FolderDialogDelete,
    FolderDialogUpdate,
    FolderDialogManagePermissions
} from "~/components";
import { Node } from "../Node";
import { NodePreview } from "../NodePreview";
import { Placeholder } from "../Placeholder";
import { createInitialOpenList, createTreeData } from "./utils";
import { useFolders } from "~/hooks";
import { ROOT_FOLDER } from "~/constants";
import { DndFolderItem, FolderItem } from "~/types";

interface ListProps {
    folders: FolderItem[];
    focusedFolderId?: string;
    hiddenFolderIds?: string[];
    enableActions?: boolean;
    onFolderClick: (data: FolderItem) => void;
}

export const List: React.VFC<ListProps> = ({
    folders,
    onFolderClick,
    focusedFolderId,
    hiddenFolderIds,
    enableActions
}) => {
    const { updateFolder } = useFolders();
    const { showSnackbar } = useSnackbar();
    const [treeData, setTreeData] = useState<NodeModel<DndFolderItem>[]>([]);
    const [initialOpenList, setInitialOpenList] = useState<undefined | InitialOpen>();
    const [openFolderIds, setOpenFolderIds] = useState<string[]>([ROOT_FOLDER]);
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState<boolean>(false);
    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();

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
        newTree: NodeModel<DndFolderItem>[],
        { dragSourceId, dropTargetId }: DropOptions
    ) => {
        try {
            const item = folders.find(folder => folder.id === dragSourceId);

            if (!item) {
                throw new Error("Folder not found!");
            }

            setTreeData(newTree);

            await updateFolder(
                {
                    ...item,
                    parentId: dropTargetId !== ROOT_FOLDER ? (dropTargetId as string) : null
                },
                { refetchFoldersList: true }
            );
        } catch (error) {
            return showSnackbar(error.message);
        }
    };

    const sort = useMemo(
        () => (a: NodeModel<DndFolderItem>, b: NodeModel<DndFolderItem>) => {
            if (a.data!.id === ROOT_FOLDER || b.data!.id === ROOT_FOLDER) {
                return 1;
            }
            return a.data!.title.localeCompare(b.data!.title, undefined, { numeric: true });
        },
        []
    );

    const handleChangeOpen = (folderIds: string[]) => {
        setOpenFolderIds([ROOT_FOLDER, ...folderIds]);
    };

    return (
        <>
            <DndProvider backend={MultiBackend} options={getBackendOptions()} context={window}>
                <Tree
                    tree={treeData}
                    rootId={"0"}
                    onDrop={handleDrop}
                    onChangeOpen={ids => handleChangeOpen(ids as string[])}
                    sort={sort}
                    canDrag={item => item!.id !== ROOT_FOLDER}
                    render={(node, { depth, isOpen, onToggle }) => (
                        <Node
                            node={node}
                            depth={depth}
                            isOpen={isOpen}
                            enableActions={enableActions}
                            onToggle={onToggle}
                            onClick={data => onFolderClick(data)}
                            onUpdateFolder={data => {
                                setSelectedFolder(data);
                                setUpdateDialogOpen(true);
                            }}
                            onSetFolderPermissions={data => {
                                setSelectedFolder(data);
                                setPermissionsDialogOpen(true);
                            }}
                            onDeleteFolder={data => {
                                setSelectedFolder(data);
                                setDeleteDialogOpen(true);
                            }}
                        />
                    )}
                    dragPreviewRender={monitorProps => <NodePreview monitorProps={monitorProps} />}
                    classes={{
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
                    />{" "}
                    <FolderDialogManagePermissions
                        folder={selectedFolder}
                        open={permissionsDialogOpen}
                        onClose={() => {
                            setPermissionsDialogOpen(false);
                            setSelectedFolder(undefined);
                        }}
                    />
                </>
            )}
        </>
    );
};
