import React from "react";
import { ReactComponent as Folder } from "@material-design-icons/svg/filled/folder.svg";

import { DragLayerMonitorProps } from "@minoru/react-dnd-treeview";

import { DndItem } from "~/types";

import { Container } from "./styled";

type Props = {
    monitorProps: DragLayerMonitorProps<DndItem>;
};

export const NodePreview: React.FC<Props> = props => {
    const item = props.monitorProps.item;

    return (
        <div className={`${Container}`}>
            <Folder />
            {item.text}
        </div>
    );
};
