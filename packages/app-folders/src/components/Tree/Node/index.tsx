import React from "react";
import { ReactComponent as ArrowRight } from "@material-design-icons/svg/filled/arrow_right.svg";
import { ReactComponent as Folder } from "@material-design-icons/svg/filled/folder.svg";

import { Container, ArrowIconContainer, FolderIconContainer, Label } from "./styled";

import { NodeModel } from "@minoru/react-dnd-treeview";
import { DndItemData } from "~/types";

type Props = {
    node: NodeModel<DndItemData>;
    depth: number;
    isOpen: boolean;
    onToggle: (id: NodeModel["id"]) => void;
    onClick: (id: NodeModel["id"]) => void;
};

export const Node: React.FC<Props> = props => {
    const { node, depth, isOpen, onToggle, onClick } = props;
    const indent = depth * 24;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(node.id);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(node.id);
    };

    return (
        <Container isFocused={!!node.data?.isFocused} style={{ paddingInlineStart: indent }}>
            <ArrowIconContainer isOpen={isOpen} onClick={handleToggle}>
                <ArrowRight />
            </ArrowIconContainer>
            <Label onClick={handleClick}>
                <FolderIconContainer>
                    <Folder />
                </FolderIconContainer>
                {node.text}
            </Label>
        </Container>
    );
};
