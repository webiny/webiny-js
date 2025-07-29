import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Tree,
    type NodeDto,
    type TreeProps,
    type WithDefaultNodeData,
    type DropOptions
} from "@webiny/admin-ui";
import { useSnackbar } from "@webiny/app-admin";
import { Node } from "../Node";
import { createInitialOpenList, createTreeData } from "./utils";
import {
    useGetFolderAncestors,
    useGetFolderLevelPermission,
    useListFoldersByParentIds,
    useUpdateFolder
} from "~/features";
import { ROOT_FOLDER } from "~/constants";
import type { FolderItem } from "~/types";
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
    const { listFoldersByParentIds, loading } = useListFoldersByParentIds();
    const { updateFolder } = useUpdateFolder();
    const { getFolderLevelPermission: canManageStructure } =
        useGetFolderLevelPermission("canManageStructure");
    const { getFolderAncestors } = useGetFolderAncestors();
    const { showSnackbar } = useSnackbar();

    const [treeData, setTreeData] = useState<NodeDto<FolderItem>[]>([]);
    const [openFolderIds, setOpenFolderIds] = useState<string[]>([ROOT_FOLDER]);

    useEffect(() => {
        setTreeData(createTreeData(folders, focusedFolderId, hiddenFolderIds));
    }, [folders, focusedFolderId, hiddenFolderIds]);

    useEffect(() => {
        setOpenFolderIds(prev => {
            const expanded = createInitialOpenList(folders, prev, focusedFolderId);
            return [...new Set([ROOT_FOLDER, ...expanded])];
        });
    }, [focusedFolderId, folders, setOpenFolderIds]);

    const handleChangeOpen: TreeProps["onChangeOpen"] = async nodes => {
        const folderIds = nodes.map(node => node.id);
        const updatedOpenIds = [...new Set([ROOT_FOLDER, ...folderIds])];
        setOpenFolderIds(updatedOpenIds);

        const fetchableIds = folderIds.filter(id => id !== ROOT_FOLDER && id !== "0");
        await listFoldersByParentIds(fetchableIds);
    };

    const handleDrop: TreeProps["onDrop"] = async (_, { dragSourceId, dropTargetId }) => {
        try {
            const item = folders.find(folder => folder.id === dragSourceId);
            if (!item) {
                throw new Error("Folder not found!");
            }

            await updateFolder({
                ...item,
                parentId: dropTargetId !== ROOT_FOLDER ? (dropTargetId as string) : null
            });
        } catch (error) {
            showSnackbar(error.message);
        }
    };

    const sort = useMemo(
        () => (a: NodeDto<any>, b: NodeDto<any>) => {
            if (a.id === ROOT_FOLDER || b.id === ROOT_FOLDER) {
                return 1;
            }
            return a.label.localeCompare(b.label, undefined, { numeric: true });
        },
        []
    );

    const canDrag: TreeProps<FolderItem>["canDrag"] = useCallback(
        (node: NodeDto<FolderItem>) => node.id !== ROOT_FOLDER && canManageStructure(node.id),
        [canManageStructure]
    );

    const canDrop: TreeProps<FolderItem>["canDrop"] = (_, options: DropOptions<FolderItem>) => {
        const { dragSourceId, dropTargetId } = options;
        const dropTagetAncestorIds = getFolderAncestors(dropTargetId).map(item => item.id);

        // Prevent dropping a folder into itself or its descendants
        return !(dragSourceId && dropTagetAncestorIds.includes(dragSourceId));
    };

    const nodeRenderer: TreeProps<FolderItem>["renderer"] = node => {
        const folder = folders.find(folder => folder.id === node.id);
        return (
            <FolderProvider folder={folder}>
                <Node enableActions={enableActions} />
            </FolderProvider>
        );
    };

    const handleNodeClick = useCallback(
        (node: WithDefaultNodeData<FolderItem>) => {
            onFolderClick(node);
        },
        [onFolderClick]
    );

    return (
        <Tree<FolderItem>
            nodes={treeData}
            rootId={"0"}
            defaultOpenNodeIds={openFolderIds}
            onChangeOpen={handleChangeOpen}
            onDrop={handleDrop}
            onNodeClick={handleNodeClick}
            sort={sort}
            canDrag={canDrag}
            canDrop={canDrop}
            renderer={nodeRenderer}
            defaultLockedOpenNodeIds={[ROOT_FOLDER]}
            loadingNodeIds={loading}
        />
    );
};
