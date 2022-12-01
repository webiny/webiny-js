import { NodeModel } from "@minoru/react-dnd-treeview";
import React from "react";

import { Element } from "./styled";
import { DndItemData } from "~/types";

interface Props {
    depth: number;
    node: NodeModel<DndItemData>;
}

export const Placeholder = ({ depth }: Props) => {
    const left = depth * 24 + 8;
    return <Element style={{ left }} />;
};
