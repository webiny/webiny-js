import React, { useMemo } from "react";
import { ReactComponent as ArrowRight } from "@material-symbols/svg-400/rounded/arrow_right.svg";
import { ReactComponent as Folder } from "@material-symbols/svg-400/rounded/folder-fill.svg";
import { ReactComponent as FolderShared } from "@material-symbols/svg-400/rounded/folder_shared-fill.svg";
import { ReactComponent as HomeIcon } from "@material-design-icons/svg/filled/home.svg";
import { NodeModel, useDragOver } from "@minoru/react-dnd-treeview";
import { MenuActions } from "../MenuActions";
import { Container, ArrowIcon, FolderIcon, Text, Content } from "./styled";
import { DndFolderItem, FolderItem } from "~/types";
import { parseIdentifier } from "@webiny/utils";
import { ROOT_FOLDER } from "~/constants";

type NodeProps = {
    node: NodeModel<DndFolderItem>;
    depth: number;
    isOpen: boolean;
    enableActions?: boolean;
    onToggle: (id: string | number) => void;
    onClick: (data: FolderItem) => void;
    onUpdateFolder: (data: FolderItem) => void;
    onDeleteFolder: (data: FolderItem) => void;
    onSetFolderPermissions: (data: FolderItem) => void;
};

type FolderProps = {
    text: string;
    isRoot: boolean;
    isOpen: boolean;
    isFocused?: boolean;
    hasPermissions?: boolean;
};

export const FolderNode: React.VFC<FolderProps> = ({ isRoot, isFocused, hasPermissions, text }) => {
    let icon = <HomeIcon />;

    if (!isRoot) {
        if (hasPermissions) {
            icon = <FolderShared />;
        } else {
            icon = <Folder />;
        }
    }

    return (
        <>
            <FolderIcon>{icon}</FolderIcon>
            <Text className={isFocused ? "focused" : ""} use={"body2"}>
                {text}
            </Text>
        </>
    );
};

export const Node: React.VFC<NodeProps> = ({
    node,
    depth,
    isOpen,
    enableActions,
    onToggle,
    onClick,
    onUpdateFolder,
    onDeleteFolder,
    onSetFolderPermissions
}) => {
    const isRoot = node.id === ROOT_FOLDER;
    // Move the placeholder line to the left based on the element depth within the tree.
    // Let's add some pixels so that the element is detached from the container but takes up the whole length while it's highlighted during dnd.
    const indent = depth === 1 ? 4 : (depth - 1) * 20 + 8;

    const dragOverProps = useDragOver(node.id, isOpen, onToggle);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(node.id);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(node.data!);
        if (node.data!.id !== ROOT_FOLDER) {
            onToggle(node.id);
        }
    };

    const id = useMemo(() => {
        const { id } = parseIdentifier(String(node.id));
        return id;
    }, [node.id]);

    // If we have at least one permission that is not inherited, we mark the folder as having permissions.
    const folderHasPermissions = useMemo(() => {
        return node.data?.permissions?.some(p => !p.inheritedFrom);
    }, [node.data?.permissions]);

    return (
        <Container
            isFocused={!!node.data?.isFocused}
            style={{ paddingInlineStart: indent }}
            {...dragOverProps}
        >
            {isRoot ? null : (
                <ArrowIcon isOpen={isOpen} onClick={handleToggle}>
                    <ArrowRight />
                </ArrowIcon>
            )}
            <Content onClick={handleClick} className={`aco-folder-${id}`}>
                <FolderNode
                    isRoot={isRoot}
                    text={node.text}
                    hasPermissions={folderHasPermissions}
                    isOpen={isRoot ? true : isOpen}
                    isFocused={!!node.data?.isFocused}
                />
            </Content>
            {node.data && enableActions && !isRoot && (
                <MenuActions
                    folder={node.data}
                    onUpdateFolder={onUpdateFolder}
                    onDeleteFolder={onDeleteFolder}
                    onSetFolderPermissions={onSetFolderPermissions}
                />
            )}
        </Container>
    );
};
