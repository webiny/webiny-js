import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Tree, type NodeDto, type TreeProps } from "@webiny/admin-ui";
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
    const { listFoldersByParentIds, getIsFolderLoading } = useListFoldersByParentIds();
    const { updateFolder } = useUpdateFolder();
    const { getFolderLevelPermission: canManageStructure } =
        useGetFolderLevelPermission("canManageStructure");
    const { showSnackbar } = useSnackbar();
    const [treeData, setTreeData] = useState<NodeDto[]>([]);
    const [initialOpenList, setInitialOpenList] = useState<undefined | string[]>();

    useEffect(() => {
        if (folders) {
            setTreeData(
                createTreeData(folders, focusedFolderId, hiddenFolderIds, getIsFolderLoading)
            );
        }
    }, [folders, focusedFolderId]);

    const memoCreateInitialOpenList = useCallback(
        (focusedFolderId?: string) => {
            return createInitialOpenList(folders, focusedFolderId);
        },
        [folders, focusedFolderId]
    );

    useEffect(() => {
        setInitialOpenList(memoCreateInitialOpenList(focusedFolderId));
    }, [focusedFolderId]);

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
        const filteredFolderIds = folderIds.filter(item => item !== ROOT_FOLDER && item !== "0");
        await listFoldersByParentIds(filteredFolderIds);
    };

    const canDrag: TreeProps["canDrag"] = useCallback(
        (node: NodeDto) => {
            const isRootFolder = node.id === ROOT_FOLDER;
            return !isRootFolder && canManageStructure(node.id);
        },
        [canManageStructure]
    );

    const nodeRenderer: TreeProps["renderer"] = useCallback(
        node => {
            const folder = folders.find(folder => folder.id === node.id);
            return (
                <FolderProvider folder={folder}>
                    <Node enableActions={enableActions} />
                </FolderProvider>
            );
        },
        [folders, enableActions]
    );

    const onNodeClick = useCallback(
        node => {
            onFolderClick(node);
        },
        [onFolderClick]
    );

    return (
        <Tree
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
        />
    );
};
