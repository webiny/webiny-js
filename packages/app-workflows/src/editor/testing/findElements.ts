import React from "react";

interface TreeProps {
    children?: React.ReactNode;
}

// Collects the elements of `type` in a React node tree without rendering it (a route's `element`).
export const findElements = (
    node: React.ReactNode,
    type: unknown,
    found: React.ReactElement[] = []
): React.ReactElement[] => {
    React.Children.forEach(node, child => {
        if (!React.isValidElement<TreeProps>(child)) {
            return;
        }
        if (child.type === type) {
            found.push(child);
        }
        findElements(child.props.children, type, found);
    });
    return found;
};
