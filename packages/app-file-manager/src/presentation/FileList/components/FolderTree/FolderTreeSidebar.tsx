import React, { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { cn, Dialog, Heading, Icon, IconButton, Separator, Text, Tooltip } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin";
import { ReactComponent as FolderIcon } from "@webiny/icons/folder.svg";
import { ReactComponent as FolderOpenIcon } from "@webiny/icons/folder_open.svg";
import { ReactComponent as HomeIcon } from "@webiny/icons/home.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as ChevronRightIcon } from "@webiny/icons/chevron_right.svg";
import { ReactComponent as ExpandMoreIcon } from "@webiny/icons/expand_more.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { useFileListPresenter } from "../../FileListPresenterProvider.js";
import type { IFolderTreeNode } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { IFolderActions } from "../../abstractions.js";

const t = i18n.ns("app-file-manager/presentation/folder-tree");

// ---------------------------------------------------------------------------
// FolderNodeActions — hover actions for a single folder node.
// ---------------------------------------------------------------------------

interface FolderNodeActionsProps {
    node: IFolderTreeNode;
    folderActions: IFolderActions;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

const FolderNodeActions = ({
    node,
    folderActions,
    canCreate,
    canEdit,
    canDelete
}: FolderNodeActionsProps) => {
    return (
        <div className={"flex items-center gap-none opacity-0 group-hover/node:opacity-100"}>
            {canCreate && (
                <Tooltip
                    side={"top"}
                    content={t`Create subfolder`}
                    trigger={
                        <IconButton
                            variant={"ghost"}
                            size={"xs"}
                            icon={<AddIcon />}
                            onClick={e => {
                                e.stopPropagation();
                                folderActions.createFolder(node.id);
                            }}
                            data-testid={`fm-folder-action-create-${node.id}`}
                        />
                    }
                />
            )}
            {canEdit && (
                <Tooltip
                    side={"top"}
                    content={t`Edit folder`}
                    trigger={
                        <IconButton
                            variant={"ghost"}
                            size={"xs"}
                            icon={<EditIcon />}
                            onClick={e => {
                                e.stopPropagation();
                                folderActions.editFolder(node.id);
                            }}
                            data-testid={`fm-folder-action-edit-${node.id}`}
                        />
                    }
                />
            )}
            {canDelete && (
                <Tooltip
                    side={"top"}
                    content={t`Delete folder`}
                    trigger={
                        <IconButton
                            variant={"ghost"}
                            size={"xs"}
                            icon={<DeleteIcon />}
                            onClick={e => {
                                e.stopPropagation();
                                void folderActions.deleteFolder(node.id);
                            }}
                            data-testid={`fm-folder-action-delete-${node.id}`}
                        />
                    }
                />
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// FolderNode — a single node in the recursive folder tree.
// ---------------------------------------------------------------------------

interface FolderNodeProps {
    node: IFolderTreeNode;
    currentFolderId: string | null;
    folderActions: IFolderActions;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    depth: number;
}

const FolderNode = observer(function FolderNode({
    node,
    currentFolderId,
    folderActions,
    canCreate,
    canEdit,
    canDelete,
    depth
}: FolderNodeProps) {
    const isSelected = node.id === currentFolderId;
    const hasChildren = node.children.length > 0;
    const [expanded, setExpanded] = useState(false);

    // Auto-expand if the current folder is this node or a descendant.
    const isAncestorOfCurrent = useCallback(
        (n: IFolderTreeNode): boolean => {
            if (n.id === currentFolderId) {
                return true;
            }
            return n.children.some(child => isAncestorOfCurrent(child));
        },
        [currentFolderId]
    );

    // Expand if this node is an ancestor of the current folder.
    const shouldExpand = expanded || isAncestorOfCurrent(node);

    const handleClick = () => {
        folderActions.selectFolder(node.id);
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(prev => !prev);
    };

    return (
        <div data-testid={`fm-folder-node-${node.id}`}>
            <div
                className={cn(
                    "group/node flex items-center gap-xs px-sm py-xs cursor-pointer rounded-sm",
                    "hover:bg-neutral-subtle",
                    isSelected && "bg-primary-subtle text-primary-default"
                )}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={handleClick}
                data-testid={`fm-folder-node-row-${node.id}`}
            >
                {/* Expand/collapse toggle. */}
                <div className={"flex-shrink-0 w-[20px]"}>
                    {hasChildren ? (
                        <IconButton
                            variant={"ghost"}
                            size={"xs"}
                            icon={shouldExpand ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                            onClick={handleToggle}
                            data-testid={`fm-folder-toggle-${node.id}`}
                        />
                    ) : null}
                </div>

                {/* Folder icon. */}
                <Icon
                    icon={isSelected ? <FolderOpenIcon /> : <FolderIcon />}
                    label={node.name}
                    size={"sm"}
                    color={isSelected ? "accent" : "neutral-strong"}
                />

                {/* Folder name. */}
                <Text
                    size={"sm"}
                    className={cn(
                        "flex-1 truncate",
                        isSelected ? "font-semibold" : "text-neutral-strong"
                    )}
                >
                    {node.name}
                </Text>

                {/* Hover actions. */}
                <FolderNodeActions
                    node={node}
                    folderActions={folderActions}
                    canCreate={canCreate}
                    canEdit={canEdit}
                    canDelete={canDelete}
                />
            </div>

            {/* Children. */}
            {shouldExpand && hasChildren && (
                <div>
                    {node.children.map(child => (
                        <FolderNode
                            key={child.id}
                            node={child}
                            currentFolderId={currentFolderId}
                            folderActions={folderActions}
                            canCreate={canCreate}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

// ---------------------------------------------------------------------------
// FolderOperationDialog — renders create/edit form or delete confirmation.
// ---------------------------------------------------------------------------

const FolderOperationDialog = observer(function FolderOperationDialog() {
    const { vm, actions } = useFileListPresenter();
    const { operation } = vm.folders;

    if (!operation.active) {
        return null;
    }

    const handleClose = () => {
        actions.folders.cancelOperation();
    };

    // Delete confirmation dialog.
    if (operation.mode === "delete") {
        return (
            <Dialog
                open={true}
                onClose={handleClose}
                title={t`Delete Folder`}
                actions={
                    <>
                        <Dialog.CancelAction onClick={handleClose} text={t`Cancel`} />
                        <Dialog.ConfirmAction
                            onClick={() => {
                                if (operation.folderId) {
                                    void actions.folders.deleteFolder(operation.folderId);
                                }
                            }}
                            text={t`Delete`}
                        />
                    </>
                }
            >
                <Text size={"md"}>
                    {t`Are you sure you want to delete this folder? This action cannot be undone.`}
                </Text>
            </Dialog>
        );
    }

    // Create or edit form dialog.
    if ((operation.mode === "create" || operation.mode === "edit") && operation.form) {
        const title = operation.mode === "create" ? t`Create Folder` : t`Edit Folder`;
        const confirmLabel = operation.mode === "create" ? t`Create` : t`Save`;

        return (
            <Dialog
                open={true}
                onClose={handleClose}
                title={title}
                actions={
                    <>
                        <Dialog.CancelAction onClick={handleClose} text={t`Cancel`} />
                        <Dialog.ConfirmAction
                            onClick={() => {
                                void operation.form!.submit();
                            }}
                            text={confirmLabel}
                        />
                    </>
                }
            >
                <FormView form={operation.form.vm} />
            </Dialog>
        );
    }

    return null;
});

// ---------------------------------------------------------------------------
// FolderTreeSidebar — main sidebar component.
// ---------------------------------------------------------------------------

/**
 * Sidebar component that renders the folder tree for the File Manager.
 * Reads vm.folders from the FileListPresenter and wires folder navigation
 * and CRUD actions through the presenter's folder actions API.
 */
export const FolderTreeSidebar = observer(function FolderTreeSidebar() {
    const { vm, actions } = useFileListPresenter();
    const { tree, currentFolderId, loading } = vm.folders;
    const { canCreate, canEdit, canDelete } = vm.permissions;

    const handleRootClick = () => {
        actions.folders.selectFolder(null);
    };

    const handleCreateRootFolder = () => {
        actions.folders.createFolder();
    };

    return (
        <div className={"flex flex-col h-main-content"} data-testid={"fm-folder-tree-sidebar"}>
            {/* Header. */}
            <div className={"flex items-center justify-between py-sm px-md"}>
                <Heading level={5}>{t`File Manager`}</Heading>
                {canCreate && (
                    <Tooltip
                        side={"bottom"}
                        content={t`Create folder`}
                        trigger={
                            <IconButton
                                variant={"ghost"}
                                size={"sm"}
                                icon={<AddIcon />}
                                onClick={handleCreateRootFolder}
                                data-testid={"fm-folder-create-root"}
                            />
                        }
                    />
                )}
            </div>
            <Separator />

            {/* Tree content. */}
            <div className={"flex-1 overflow-y-auto py-xs"}>
                {/* Root / All Files entry. */}
                <div
                    className={cn(
                        "flex items-center gap-xs px-sm py-xs cursor-pointer rounded-sm",
                        "hover:bg-neutral-subtle",
                        currentFolderId === null && "bg-primary-subtle text-primary-default"
                    )}
                    onClick={handleRootClick}
                    data-testid={"fm-folder-root"}
                >
                    <div className={"flex-shrink-0 w-[20px]"} />
                    <Icon
                        icon={<HomeIcon />}
                        label={t`All Files`}
                        size={"sm"}
                        color={currentFolderId === null ? "accent" : "neutral-strong"}
                    />
                    <Text
                        size={"sm"}
                        className={cn(
                            "flex-1 truncate",
                            currentFolderId === null ? "font-semibold" : "text-neutral-strong"
                        )}
                    >
                        {t`All Files`}
                    </Text>
                </div>

                {/* Loading state. */}
                {loading && (
                    <div className={"px-md py-sm"}>
                        <Text size={"sm"} className={"text-neutral-dimmed"}>
                            {t`Loading folders...`}
                        </Text>
                    </div>
                )}

                {/* Folder tree nodes. */}
                {!loading &&
                    tree.map(node => (
                        <FolderNode
                            key={node.id}
                            node={node}
                            currentFolderId={currentFolderId}
                            folderActions={actions.folders}
                            canCreate={canCreate}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            depth={0}
                        />
                    ))}
            </div>

            {/* Folder operation dialog (create/edit/delete). */}
            <FolderOperationDialog />
        </div>
    );
});
