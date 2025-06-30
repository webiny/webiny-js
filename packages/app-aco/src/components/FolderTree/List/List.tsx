import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Tree, type NodeDto, type TreeProps, type WithDefaultNodeData } from "@webiny/admin-ui";
import { useSnackbar } from "@webiny/app-admin";
import { Node } from "../Node";
import { createInitialOpenList, createTreeData } from "./utils";
import {
    useGetFolderLevelPermission,
    useListFoldersByParentIds,
    useUpdateFolder
} from "~/features";
import { ROOT_FOLDER } from "~/constants";
import { FolderItem } from "~/types";
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
    const { showSnackbar } = useSnackbar();
    const [treeData, setTreeData] = useState<NodeDto<FolderItem>[]>([]);
    const [initialOpenList, setInitialOpenList] = useState<undefined | string[]>();
    const [openFolderIds, setOpenFolderIds] = useState<string[]>([ROOT_FOLDER]);

    useEffect(() => {
        if (folders) {
            setTreeData(createTreeData(folders, focusedFolderId, hiddenFolderIds));
        }
    }, [folders, focusedFolderId, hiddenFolderIds]);

    const memoCreateInitialOpenList = useCallback(
        (focusedFolderId?: string) => {
            return createInitialOpenList(folders, openFolderIds, focusedFolderId);
        },
        [folders, openFolderIds]
    );

    useEffect(() => {
        const openIds = memoCreateInitialOpenList(focusedFolderId);
        setInitialOpenList(openIds);
    }, [focusedFolderId, openFolderIds]);

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
            return showSnackbar(error.message);
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

    const handleChangeOpen: TreeProps["onChangeOpen"] = async nodes => {
        const folderIds = nodes.map(node => node.id);
        setOpenFolderIds([...new Set([ROOT_FOLDER, ...folderIds])]);
        const filteredFolderIds = folderIds.filter(item => item !== ROOT_FOLDER && item !== "0");
        await listFoldersByParentIds(filteredFolderIds);
    };

    const canDrag: TreeProps<FolderItem>["canDrag"] = useCallback(
        (node: NodeDto<FolderItem>) => {
            const isRootFolder = node.id === ROOT_FOLDER;
            return !isRootFolder && canManageStructure(node.id);
        },
        [canManageStructure]
    );

    const nodeRenderer: TreeProps<FolderItem>["renderer"] = node => {
        const folder = folders.find(folder => folder.id === node.id);
        return (
            <FolderProvider folder={folder}>
                <Node enableActions={enableActions} />
            </FolderProvider>
        );
    };

    const onNodeClick = useCallback(
        (node: WithDefaultNodeData<FolderItem>) => {
            onFolderClick(node);
        },
        [onFolderClick]
    );

    return (
        <Tree<FolderItem>
            nodes={treeData}
            rootId={"0"}
            onDrop={handleDrop}
            onChangeOpen={handleChangeOpen}
            onNodeClick={onNodeClick}
            sort={sort}
            canDrag={canDrag}
            renderer={nodeRenderer}
            defaultOpenNodeIds={initialOpenList}
            defaultLockedOpenNodeIds={[ROOT_FOLDER]}
            loadingNodeIds={loading}
        />
    );
};
