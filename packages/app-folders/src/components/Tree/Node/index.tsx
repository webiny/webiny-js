import React from "react";
import { ReactComponent as ArrowRight } from "@material-symbols/svg-400/outlined/arrow_right.svg";
import { ReactComponent as Folder } from "@material-symbols/svg-400/outlined/folder-fill.svg";
import { ReactComponent as FolderOpen } from "@material-symbols/svg-400/outlined/folder_open-fill.svg";
import { NodeModel, useDragOver } from "@minoru/react-dnd-treeview";

import { MenuActions } from "~/components/Tree/MenuActions";

import { Container, ArrowIcon, FolderIcon, Text, Content } from "./styled";

import { DndItemData } from "~/types";

type Props = {
    node: NodeModel<DndItemData>;
    depth: number;
    isOpen: boolean;
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
    onToggle,
    onClick,
    onUpdateFolder,
    onDeleteFolder
}: Props) => {
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
            {node.data && (
                <MenuActions
                    folder={node.data}
                    onUpdateFolder={onUpdateFolder}
                    onDeleteFolder={onDeleteFolder}
                />
            )}
        </Container>
    );
};
