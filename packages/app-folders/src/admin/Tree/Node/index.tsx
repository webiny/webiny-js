import React from "react";
import { NodeModel } from "@minoru/react-dnd-treeview";
import { ReactComponent as ArrowRight } from "@material-design-icons/svg/filled/arrow_right.svg";
import { ReactComponent as Folder } from "@material-design-icons/svg/filled/folder.svg";

import { Container, IconContainer, ArrowIconContainer, FolderIconContainer, Label } from "./styled";

import { DndItem } from "~/types";

type Props = {
    node: NodeModel<DndItem>;
    depth: number;
    isOpen: boolean;
    onToggle: (id: NodeModel["id"]) => void;
    onClick: (id: NodeModel["id"]) => void;
};

export const Node: React.FC<Props> = props => {
    const indent = props.depth * 24;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        props.onToggle(props.node.id);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        props.onClick(props.node.id);
    };

    return (
        <div className={`tree-node ${Container}`} style={{ paddingInlineStart: indent }}>
            <div
                className={`${ArrowIconContainer} ${IconContainer} ${props.isOpen ? "isOpen" : ""}`}
                onClick={handleToggle}
            >
                <ArrowRight />
            </div>
            <div className={Label} onClick={handleClick}>
                <div className={`${FolderIconContainer} ${IconContainer}`}>
                    <Folder />
                </div>
                {`${props.node.text}`}
            </div>
        </div>
    );
};
