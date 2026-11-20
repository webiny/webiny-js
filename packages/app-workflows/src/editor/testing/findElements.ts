import React from "react";

interface TreeProps {
    children?: React.ReactNode;
}

/**
 * Collects the elements of `type` in a React node tree without rendering it (a route's `element`).
 * An element is collected only when its type is `type`, so its props are that component's props;
 * a host tag such as "title" gives elements with `children`.
 */
export function findElements<TProps>(
    node: React.ReactNode,
    type: React.JSXElementConstructor<TProps>
): React.ReactElement<TProps>[];
export function findElements(node: React.ReactNode, type: string): React.ReactElement<TreeProps>[];
export function findElements(node: React.ReactNode, type: unknown): React.ReactElement<unknown>[] {
    const found: React.ReactElement<unknown>[] = [];
    const visit = (current: React.ReactNode) => {
        React.Children.forEach(current, child => {
            if (!React.isValidElement<TreeProps>(child)) {
                return;
            }
            if (child.type === type) {
                found.push(child);
            }
            visit(child.props.children);
        });
    };
    visit(node);
    return found;
}
