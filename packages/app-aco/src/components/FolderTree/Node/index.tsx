import React from "react";
import { ReactComponent as ArrowRight } from "@material-symbols/svg-400/rounded/arrow_right.svg";
import { ReactComponent as Folder } from "@material-symbols/svg-400/rounded/folder-fill.svg";
import { ReactComponent as FolderOpen } from "@material-symbols/svg-400/rounded/folder_open-fill.svg";
import { ReactComponent as HomeIcon } from "@material-design-icons/svg/filled/home.svg";
import { NodeModel, useDragOver } from "@minoru/react-dnd-treeview";
import { MenuActions } from "../MenuActions";
import { Container, ArrowIcon, FolderIcon, Text, Content } from "./styled";
import { DndFolderItem, FolderItem } from "~/types";

type NodeProps = {
    node: NodeModel<DndFolderItem>;
    depth: number;
    isOpen: boolean;
    enableActions?: boolean;
    onToggle: (id: string | number) => void;
    onClick: (data: FolderItem) => void;
    onUpdateFolder: (data: FolderItem) => void;
    onDeleteFolder: (data: FolderItem) => void;
};

type FolderProps = {
    text: string;
    isRoot: boolean;
    isOpen: boolean;
    isFocused?: boolean;
};

export const FolderNode: React.VFC<FolderProps> = ({ isRoot, isOpen, isFocused, text }) => {
    const icon = isRoot ? <HomeIcon /> : isOpen ? <FolderOpen /> : <Folder />;

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
    onDeleteFolder
}) => {
    const isRoot = node.id === "ROOT";
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
        if (node.data!.id !== "ROOT") {
            onToggle(node.id);
        }
    };

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
            <Content onClick={handleClick}>
                <FolderNode
                    isRoot={isRoot}
                    text={node.text}
                    isOpen={isRoot ? true : isOpen}
                    isFocused={!!node.data?.isFocused}
                />
            </Content>
            {node.data && enableActions && !isRoot && (
                <MenuActions
                    folder={node.data}
                    onUpdateFolder={onUpdateFolder}
                    onDeleteFolder={onDeleteFolder}
                />
            )}
        </Container>
    );
};
