import React from "react";
import { ReactComponent as Folder } from "@material-design-icons/svg/filled/folder.svg";
import { DragLayerMonitorProps } from "@minoru/react-dnd-treeview";

import { Container } from "./styled";

import { DndItemData } from "~/types";

type Props = {
    monitorProps: DragLayerMonitorProps<DndItemData>;
};

export const NodePreview: React.FC<Props> = props => {
    const item = props.monitorProps.item;

    return (
        <Container>
            <Folder />
            {item.text}
        </Container>
    );
};
