import React from "react";
import { ReactComponent as ArrowRight } from "@material-symbols/svg-400/rounded/arrow_right.svg";
import { ReactComponent as Folder } from "@material-symbols/svg-400/rounded/folder-fill.svg";
import { ReactComponent as FolderOpen } from "@material-symbols/svg-400/rounded/folder_open-fill.svg";
import { NodeModel, useDragOver } from "@minoru/react-dnd-treeview";

import { MenuActions } from "~/components/Tree/MenuActions";

import { Container, ArrowIcon, FolderIcon, Text, Content } from "./styled";

import { DndItemData } from "~/types";

type Props = {
    node: NodeModel<DndItemData>;
    depth: number;
    isOpen: boolean;
    enableActions?: boolean;
    onToggle: (id: NodeModel<DndItemData>["id"]) => void;
    onClick: (data: NodeModel<DndItemData>["data"]) => void;
    onUpdateFolder: (data: NodeModel<DndItemData>["data"]) => void;
    onDeleteFolder: (data: NodeModel<DndItemData>["data"]) => void;
};

type FolderProps = {
    text: string;
    isOpen: boolean;
};

export const FolderNode = ({ isOpen, text }: FolderProps) => {
    return (
        <>
            <FolderIcon>{isOpen ? <FolderOpen /> : <Folder />}</FolderIcon>
            <Text use={"body2"}>{text}</Text>
        </>
    );
};

export const Node = ({
    node,
    depth,
    isOpen,
    enableActions,
    onToggle,
    onClick,
    onUpdateFolder,
    onDeleteFolder
}: Props) => {
    // Move the placeholder line to the left based on the element depth within the tree.
    // Let's add some pixels so that the element is detached from the container but takes up the whole length while it's highlighted during dnd.
    const indent = depth * 24 + 8;

    const dragOverProps = useDragOver(node.id, isOpen, onToggle);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(node.id);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(node.data);
    };

    return (
        <Container
            isFocused={!!node.data?.isFocused}
            style={{ paddingInlineStart: indent }}
            {...dragOverProps}
        >
            <ArrowIcon isOpen={isOpen} onClick={handleToggle}>
                <ArrowRight />
            </ArrowIcon>
            <Content onClick={handleClick}>
                <FolderNode text={node.text} isOpen={isOpen} />
            </Content>
            {node.data && enableActions && (
                <MenuActions
                    folder={node.data}
                    onUpdateFolder={onUpdateFolder}
                    onDeleteFolder={onDeleteFolder}
                />
            )}
        </Container>
    );
};
