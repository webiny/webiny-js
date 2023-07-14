import React from "react";
import { DragLayerMonitorProps } from "@minoru/react-dnd-treeview";

import { FolderNode } from "../Node";
import { Container } from "./styled";

import { DndFolderItem } from "~/types";

type NodePreviewProps = {
    monitorProps: DragLayerMonitorProps<DndFolderItem>;
};

export const NodePreview: React.VFC<NodePreviewProps> = props => {
    const item = props.monitorProps.item;

    return (
        <Container>
            <FolderNode text={item.text} isOpen={false} isRoot={false} />
        </Container>
    );
};
