import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Tree,
    type NodeDto,
    type TreeProps,
    type WithDefaultNodeData,
    type DropOptions
} from "@webiny/admin-ui";
import { useSnackbar } from "@webiny/app-admin";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { useGetFolderLevelPermission } from "~/features/folders/getFolderLevelPermission/index.js";
import { useListFoldersByParentIds } from "~/features/folders/listFoldersByParentIds/index.js";
import { useGetFolderAncestors } from "~/features/folders/getFolderAncestors/index.js";
import { useUpdateFolder } from "~/features/folders/updateFolder/index.js";
import { Node } from "../Node/index.js";
import { createInitialOpenList, createTreeData } from "./utils.js";
import { ROOT_FOLDER } from "~/constants.js";
import { FolderProvider } from "~/contexts/folder.js";
import { useConfirmMoveFolderDialog } from "~/dialogs/index.js";
import type { FolderActionConfig } from "~/config/AcoConfig.js";

interface ListProps {
    folders: FolderDto[];
    folderActions: FolderActionConfig[];
    dropConfirmation?: boolean;
    focusedFolderId?: string;
    hiddenFolderIds?: string[];
    enableActions?: boolean;
    onFolderClick: (data: FolderDto) => void;
}

export const List = ({
    folders,
    folderActions,
    onFolderClick,
    focusedFolderId,
    hiddenFolderIds,
    enableActions,
    dropConfirmation = false
}: ListProps) => {
    const { listFoldersByParentIds, loading } = useListFoldersByParentIds();
    const { updateFolder } = useUpdateFolder();
    const { getFolderLevelPermission: canManageStructure } =
        useGetFolderLevelPermission("canManageStructure");
    const { getFolderAncestors } = useGetFolderAncestors();
    const { showSnackbar } = useSnackbar();

    const [treeData, setTreeData] = useState<NodeDto<FolderDto>[]>([]);
    const [openFolderIds, setOpenFolderIds] = useState<string[]>([ROOT_FOLDER]);
    const { showDialog: showConfirmMoveFolderDialog } = useConfirmMoveFolderDialog();

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

    const onDrop = useCallback<NonNullable<TreeProps["onDrop"]>>(
        async (newTree, options: DropOptions) => {
            // Function to execute the drop logic
            const runDrop = async () => handleDrop(newTree, options);

            // If drop confirmation is enabled, show dialog before proceeding
            if (dropConfirmation) {
                const { dragSourceId, dropTargetId } = options;
                const folder = folders.find(f => f.id === dragSourceId);
                const targetFolder = folders.find(f => f.id === dropTargetId);

                // Abort if either folder is not found
                if (!folder || !targetFolder) {
                    return;
                }

                showConfirmMoveFolderDialog({
                    folder,
                    targetFolder,
                    onAccept: runDrop
                });
            } else {
                // Otherwise, perform the drop immediately
                await runDrop();
            }
        },
        [folders, dropConfirmation, showConfirmMoveFolderDialog]
    );

    const sort = useMemo(
        () => (a: NodeDto<any>, b: NodeDto<any>) => {
            if (a.id === ROOT_FOLDER || b.id === ROOT_FOLDER) {
                return 1;
            }
            return a.label.localeCompare(b.label, undefined, { numeric: true });
        },
        []
    );

    const canDrag: TreeProps<FolderDto>["canDrag"] = useCallback(
        (node: NodeDto<FolderDto>) => node.id !== ROOT_FOLDER && canManageStructure(node.id),
        [canManageStructure]
    );

    const canDrop: TreeProps<FolderDto>["canDrop"] = (_, options: DropOptions<FolderDto>) => {
        const { dragSourceId, dropTargetId } = options;
        const dropTagetAncestorIds = getFolderAncestors(dropTargetId).map(item => item.id);

        // Prevent dropping a folder into itself or its descendants
        return !(dragSourceId && dropTagetAncestorIds.includes(dragSourceId));
    };

    const nodeRenderer: TreeProps<FolderDto>["renderer"] = node => {
        const folder = folders.find(folder => folder.id === node.id);
        return (
            <FolderProvider folder={folder}>
                <Node enableActions={enableActions} folderActions={folderActions} />
            </FolderProvider>
        );
    };

    const handleNodeClick = useCallback(
        (node: WithDefaultNodeData<FolderDto>) => {
            onFolderClick(node);
        },
        [onFolderClick]
    );

    return (
        <Tree<FolderDto>
            nodes={treeData}
            rootId={"0"}
            defaultOpenNodeIds={openFolderIds}
            onChangeOpen={handleChangeOpen}
            onDrop={onDrop}
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
