import React from "react";
import { ReactComponent as ArrowRight } from "@material-design-icons/svg/filled/arrow_right.svg";
import { ReactComponent as Folder } from "@material-design-icons/svg/filled/folder.svg";
import { NodeModel, useDragOver } from "@minoru/react-dnd-treeview";

import { Container, ArrowIcon, FolderIcon, Text, Content } from "./styled";

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

    const dragOverProps = useDragOver(node.id, isOpen, onToggle);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(node.id);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(node.id);
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
                <FolderIcon>
                    <Folder />
                </FolderIcon>
                <Text>{node.text}</Text>
            </Content>
        </Container>
    );
};
