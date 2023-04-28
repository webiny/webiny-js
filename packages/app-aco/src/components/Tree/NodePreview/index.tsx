import React from "react";
import { DragLayerMonitorProps } from "@minoru/react-dnd-treeview";

import { FolderNode } from "~/components/Tree/Node";
import { Container } from "./styled";

import { DndItemData } from "~/types";

type NodePreviewProps = {
    monitorProps: DragLayerMonitorProps<DndItemData>;
};

export const NodePreview: React.VFC<NodePreviewProps> = props => {
    const item = props.monitorProps.item;

    return (
        <Container>
            <FolderNode text={item.text} isOpen={false} />
        </Container>
    );
};
