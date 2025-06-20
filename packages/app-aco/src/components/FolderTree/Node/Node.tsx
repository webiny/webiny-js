import React, { useMemo } from "react";
import { NodeModel, useDragOver } from "@minoru/react-dnd-treeview";
import { cn, Text, Tree } from "@webiny/admin-ui";
import { ReactComponent as Folder } from "@webiny/icons/folder.svg";
import { ReactComponent as FolderShared } from "@webiny/icons/folder_shared.svg";
import { ReactComponent as HomeIcon } from "@webiny/icons/home.svg";
import { parseIdentifier } from "@webiny/utils";
import { MenuActions } from "../MenuActions";
import { ROOT_FOLDER } from "~/constants";
import { useFolder } from "~/hooks";
import { DndFolderItemData, FolderItem } from "~/types";

type NodeProps = {
    node: NodeModel<DndFolderItemData>;
    depth: number;
    isOpen: boolean;
    isLoading?: boolean;
    enableActions?: boolean;
    onToggle: (id: string | number) => void;
    onClick: (data: FolderItem) => void;
    handleRef: React.Ref<HTMLSpanElement>;
};

interface FolderProps extends React.HTMLAttributes<HTMLDivElement> {
    text: string;
    isRoot: boolean;
    isActive: boolean;
    hasNonInheritedPermissions?: boolean;
    canManagePermissions?: boolean;
}

export const FolderNode = ({
    isRoot,
    isActive,
    hasNonInheritedPermissions,
    canManagePermissions,
    text,
    className,
    ...props
}: FolderProps) => {
    let icon = <HomeIcon />;

    if (!isRoot) {
        if (hasNonInheritedPermissions && canManagePermissions) {
            icon = <FolderShared />;
        } else {
            icon = <Folder />;
        }
    }

    return (
        <div
            {...props}
            className={cn("wby-flex wby-items-center wby-w-full wby-gap-sm wby-pr-xxl", className)}
        >
            <Tree.Item.Icon label={"Folder"} element={icon} active={isActive} />
            <Text as={"div"} className={"wby-truncate"}>
                {text}
            </Text>
        </div>
    );
};

export const Node = ({
    node,
    depth,
    isOpen,
    isLoading,
    enableActions,
    onToggle,
    onClick,
    handleRef
}: NodeProps) => {
    const { folder } = useFolder();
    const isRoot = folder.id === ROOT_FOLDER;

    // Indentation logic:
    // Depth 0 and 1 share the same base padding of 8px.
    // From depth 2 onward, increase padding by 24px per level, starting from 32px.
    const indent = depth <= 1 ? 8 : (depth - 2) * 24 + 32;

    const dragOverProps = useDragOver(folder.id, isOpen, onToggle);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(folder.id);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(folder);
        if (folder.id !== ROOT_FOLDER) {
            onToggle(folder.id);
        }
    };

    const id = useMemo(() => {
        const { id } = parseIdentifier(String(folder.id));
        return id;
    }, [folder.id]);

    const { hasNonInheritedPermissions, canManagePermissions } = folder || {};

    return (
        <Tree.Item
            active={!!node.data?.isFocused}
            style={{ paddingInlineStart: indent }}
            {...dragOverProps}
        >
            {isRoot ? null : (
                <>
                    <Tree.Item.DragHandle handleRef={handleRef} />
                    <Tree.Item.CollapseTrigger
                        open={isOpen}
                        loading={isLoading}
                        onClick={handleToggle}
                    />
                </>
            )}
            <Tree.Item.Content onClick={handleClick} className={`aco-folder-${id}`}>
                <FolderNode
                    isRoot={isRoot}
                    isActive={!!node.data?.isFocused}
                    text={node.text}
                    hasNonInheritedPermissions={hasNonInheritedPermissions}
                    canManagePermissions={canManagePermissions}
                />
            </Tree.Item.Content>
            {enableActions && !isRoot && <MenuActions />}
        </Tree.Item>
    );
};
