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
import useDeepCompareEffect from "use-deep-compare-effect";

import { FolderDialogDelete, FolderDialogUpdate } from "~/components";
import { Node } from "~/components/Tree/Node";
import { NodePreview } from "~/components/Tree/NodePreview";
import { Placeholder } from "~/components/Tree/Placeholder";

import { createTreeData, createInitialOpenList } from "./utils";

import { useFolders } from "~/hooks";

import { ROOT_ID } from "./constants";

import { DndItemData, FolderItem } from "~/types";

type Props = {
    type: string;
    folders: FolderItem[];
    focusedFolderId?: string;
    onFolderClick: (data: NodeModel<DndItemData>["data"]) => void;
    onDragStart: () => void;
    onDragEnd: () => void;
};

export const List = ({
    type,
    folders,
    onFolderClick,
    focusedFolderId,
    onDragStart,
    onDragEnd
}: Props) => {
    const { updateFolder } = useFolders(type);
    const { showSnackbar } = useSnackbar();
    const [treeData, setTreeData] = useState<NodeModel<DndItemData>[]>([]);
    const [initialOpenList, setInitialOpenList] = useState<undefined | InitialOpen>(undefined);
    const [openFolderIds, setOpenFolderIds] = useState<NodeModel<DndItemData>["id"][]>([]);
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();

    useDeepCompareEffect(() => {
        if (folders) {
            setTreeData(createTreeData(folders, focusedFolderId));
        }

        /**
         *  We are spreading the `folders`:
         *  in case of folder value update (e.g. name) from any component within the UI does not trigger the tree data update.
         *  TODO: need investigation.
         */
    }, [{ ...folders }, focusedFolderId]);

    useEffect(() => {
        if (folders) {
            setInitialOpenList(createInitialOpenList(folders, openFolderIds, focusedFolderId));
        }
    }, []);

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
        return a.data!.title.localeCompare(b.data!.title, undefined, { numeric: true });
    };

    const handleChangeOpen = (folderIds: NodeModel["id"][]) => {
        setOpenFolderIds(folderIds);
    };

    return (
        <>
            <DndProvider backend={MultiBackend} options={getBackendOptions()}>
                <Tree
                    tree={treeData}
                    rootId={ROOT_ID}
                    onDrop={handleDrop}
                    onChangeOpen={handleChangeOpen}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
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
                    dragPreviewRender={monitorProps => <NodePreview monitorProps={monitorProps} />}
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
        </>
    );
};
