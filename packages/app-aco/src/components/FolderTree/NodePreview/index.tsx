import React from "react";
import { DragLayerMonitorProps } from "@minoru/react-dnd-treeview";

import { FolderNode } from "../Node";
import { Container } from "./styled";

import { DndFolderItemData } from "~/types";

type NodePreviewProps = {
    monitorProps: DragLayerMonitorProps<DndFolderItemData>;
};

export const NodePreview = (props: NodePreviewProps) => {
    const item = props.monitorProps.item;

    return (
        <Container>
            <FolderNode text={item.text} isOpen={false} isRoot={false} />
        </Container>
    );
};
