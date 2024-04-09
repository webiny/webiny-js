import React from "react";

import { Element } from "./styled";

interface PlaceholderProps {
    depth: number;
}

export const Placeholder = ({ depth }: PlaceholderProps) => {
    // Move the placeholder line to the left based on the element depth within the tree.
    // Let's add some pixels so that the element is detached from the container but takes up the whole length while it's highlighted during dnd.
    const left = depth * 24 + 8;
    return <Element style={{ left }} />;
};
