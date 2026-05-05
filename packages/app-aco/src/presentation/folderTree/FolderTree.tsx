import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Tree,
    Tooltip,
    type NodeDto,
    type TreeProps,
    type WithDefaultNodeData,
    type DropOptions
} from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { useSnackbar } from "@webiny/app-admin";
import { ROOT_FOLDER } from "~/constants.js";
import { FolderProvider } from "~/contexts/folder.js";
import { Node } from "~/components/FolderTree/Node/Node.js";
import { Loader } from "~/components/FolderTree/Loader/Loader.js";
import { ButtonCreate } from "~/components/FolderTree/ButtonCreate/ButtonCreate.js";
import { useConfirmMoveFolderDialog } from "~/dialogs/index.js";
import { createTreeData, createInitialOpenList } from "~/components/FolderTree/List/utils.js";
import { FolderTreePresenterFeature } from "./feature.js";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import type { FolderActionConfig } from "~/config/AcoConfig.js";
import type { IFolderTreeCallbacks, IFolderTreeViewModel } from "./abstractions.js";

export interface PresenterFolderTreeProps {
    vm: IFolderTreeViewModel;
    actions: IFolderTreeCallbacks;
    folderActions?: FolderActionConfig[];
    enableCreate?: boolean;
    enableActions?: boolean;
    dropConfirmation?: boolean;
    rootFolderLabel?: string;
    hiddenFolderIds?: string[];
}

export interface UncontrolledFolderTreeProps extends Omit<PresenterFolderTreeProps, "vm" | "actions"> {
    focusedFolderId?: string | null;
    onFolderClick?: (folderId: string | null) => void;
}

function flattenTreeToFolderDtos(
    tree: { id: string; name: string; slug: string; parentId: string | null; children: any[] }[]
): FolderDto[] {
    const result: FolderDto[] = [];
    const emptyIdentity = { id: "", displayName: "", type: "" };

    const walk = (nodes: typeof tree) => {
        for (const node of nodes) {
            result.push({
                id: node.id,
                title: node.name,
                slug: node.slug,
                type: "",
                parentId: node.parentId,
                path: "",
                permissions: [],
                hasNonInheritedPermissions: false,
                canManagePermissions: false,
                canManageStructure: true,
                canManageContent: true,
                createdBy: emptyIdentity,
                createdOn: "",
                savedBy: emptyIdentity,
                savedOn: "",
                modifiedBy: null,
                modifiedOn: null,
                extensions: {}
            });
            if (node.children.length > 0) {
                walk(node.children);
            }
        }
    };
    walk(tree);
    return result;
}

export const FolderTree = ({
    vm,
    actions,
    folderActions = [],
    enableCreate,
    enableActions,
    dropConfirmation = false,
    rootFolderLabel,
    hiddenFolderIds
}: PresenterFolderTreeProps) => {
    const { showSnackbar } = useSnackbar();
    const { showDialog: showConfirmMoveFolderDialog } = useConfirmMoveFolderDialog();

    const focusedFolderId = vm.currentFolderId ?? ROOT_FOLDER;

    const folders = useMemo(() => flattenTreeToFolderDtos(vm.tree), [vm.tree]);

    const localFolders = useMemo(() => {
        if (!folders.length) {
            return [];
        }
        return folders.map(item =>
            item.id === ROOT_FOLDER && rootFolderLabel ? { ...item, title: rootFolderLabel } : item
        );
    }, [folders, rootFolderLabel]);

    const [treeData, setTreeData] = useState<NodeDto<FolderDto>[]>([]);
    const [openFolderIds, setOpenFolderIds] = useState<string[]>([ROOT_FOLDER]);

    useEffect(() => {
        setTreeData(createTreeData(localFolders, focusedFolderId, hiddenFolderIds));
    }, [localFolders, focusedFolderId, hiddenFolderIds]);

    useEffect(() => {
        setOpenFolderIds(prev => {
            const expanded = createInitialOpenList(localFolders, prev, focusedFolderId);
            return [...new Set([ROOT_FOLDER, ...expanded])];
        });
    }, [focusedFolderId, localFolders]);

    const handleChangeOpen: TreeProps["onChangeOpen"] = async nodes => {
        const folderIds = nodes.map(node => node.id);
        const updatedOpenIds = [...new Set([ROOT_FOLDER, ...folderIds])];
        setOpenFolderIds(updatedOpenIds);

        await actions.loadChildFolders(folderIds);
    };

    const handleDrop: TreeProps["onDrop"] = async (_, { dragSourceId, dropTargetId }) => {
        try {
            const targetParentId =
                dropTargetId !== ROOT_FOLDER ? (dropTargetId as string) : null;
            await actions.moveFolder(dragSourceId as string, targetParentId);
        } catch (error) {
            showSnackbar((error as Error).message);
        }
    };

    const onDrop = useCallback<NonNullable<TreeProps["onDrop"]>>(
        async (newTree, options: DropOptions) => {
            const runDrop = async () => handleDrop(newTree, options);

            if (dropConfirmation) {
                const { dragSourceId, dropTargetId } = options;
                const folder = localFolders.find(f => f.id === dragSourceId);
                const targetFolder = localFolders.find(f => f.id === dropTargetId);

                if (!folder || !targetFolder) {
                    return;
                }

                showConfirmMoveFolderDialog({
                    folder,
                    targetFolder,
                    onAccept: runDrop
                });
            } else {
                await runDrop();
            }
        },
        [localFolders, dropConfirmation, showConfirmMoveFolderDialog]
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
        (node: NodeDto<FolderDto>) =>
            node.id !== ROOT_FOLDER && actions.canManageStructure(node.id),
        [actions]
    );

    const canDrop: TreeProps<FolderDto>["canDrop"] = (_, options: DropOptions<FolderDto>) => {
        const { dragSourceId, dropTargetId } = options;
        const ancestorIds = actions.getAncestorIds(dropTargetId as string);
        return !(dragSourceId && ancestorIds.includes(dragSourceId as string));
    };

    const nodeRenderer: TreeProps<FolderDto>["renderer"] = node => {
        const folder = localFolders.find(f => f.id === node.id);
        return (
            <FolderProvider folder={folder}>
                <Node enableActions={enableActions} folderActions={folderActions} />
            </FolderProvider>
        );
    };

    const handleNodeClick = useCallback(
        (node: WithDefaultNodeData<FolderDto>) => {
            actions.selectFolder(node.id === ROOT_FOLDER ? null : node.id);
        },
        [actions]
    );

    const createButton = useMemo(() => {
        if (!enableCreate) {
            return null;
        }

        const canCreate = actions.canManageStructure(focusedFolderId);
        const button = (
            <ButtonCreate
                disabled={!canCreate}
                onCreateFolder={() =>
                    actions.createFolder(
                        focusedFolderId === ROOT_FOLDER ? undefined : focusedFolderId
                    )
                }
            />
        );

        return canCreate ? (
            button
        ) : (
            <Tooltip
                content={`Cannot create folder because you're not an owner.`}
                trigger={button}
            />
        );
    }, [enableCreate, actions, focusedFolderId, localFolders]);

    if (vm.loading) {
        return <Loader />;
    }

    return (
        <div className="my-xs">
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
                loadingNodeIds={vm.loadingNodeIds}
            />
            {enableCreate && (
                <div className={"m-xs-plus mt-sm-plus mb-lg pl-sm-extra"}>{createButton}</div>
            )}
        </div>
    );
};

export const UncontrolledFolderTree = ({
    focusedFolderId,
    onFolderClick,
    ...props
}: UncontrolledFolderTreeProps) => {
    const { presenter } = useFeature(FolderTreePresenterFeature);

    const vm = useMemo(() => {
        if (focusedFolderId === undefined) {
            return presenter.vm;
        }
        return { ...presenter.vm, currentFolderId: focusedFolderId };
    }, [presenter.vm, focusedFolderId]);

    const actions = useMemo(() => {
        if (!onFolderClick) {
            return presenter;
        }
        return { ...presenter, selectFolder: onFolderClick };
    }, [presenter, onFolderClick]);

    return <FolderTree vm={vm} actions={actions} {...props} />;
};
