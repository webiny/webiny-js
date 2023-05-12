import { NodeModel } from "@minoru/react-dnd-treeview";
import React from "react";

import { Element } from "./styled";
import { DndItemData } from "~/types";

interface Props {
    depth: number;
    node: NodeModel<DndItemData>;
}

export const Placeholder = ({ depth }: Props) => {
    // Move the placeholder line to the left based on the element depth within the tree.
    // Let's add some pixels so that the element is detached from the container but takes up the whole length while it's highlighted during dnd.
    const left = depth * 24 + 8;
    return <Element style={{ left }} />;
};
