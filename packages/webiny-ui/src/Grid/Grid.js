// @flow
import * as React from "react";
import { Grid as RmwcGrid, GridCell as RmwcGridCell, GridInner as RmwcGridInner } from "@rmwc/grid";

/**
 * Cell must be direct children of Grid component.
 * @param props
 * @returns {*}
 * @constructor
 */
export const Cell = (props: Props) => {
    return <RmwcGridCell {...props}>{props.children}</RmwcGridCell>;
};

export type GridInnerProps = {
    // One or more Cell components.
    children: React.ChildrenArray<React.Element<typeof Cell>>
};

export const GridInner = (props: GridInnerProps) => {
    return <RmwcGridInner {...props}>{props.children}</RmwcGridInner>;
};

export type Props = {
    // One or more Cell components.
    children?: React.Node,

    // Default number of columns to span.
    span?: number,

    // Number of columns to span on a phone.
    phone?: number,

    // Number of columns to span on a tablet.
    tablet?: number,

    // Number of columns to span on a desktop.
    desktop?: number,

    // Specifies the order of the cell.
    order?: number,

    // Specifies the alignment of cell
    align?: "top" | "middle" | "bottom",

    // CSS class name that will be added to the element
    className?: string
};

export type GridProps = {
    // One or more Cell components.
    children: React.ChildrenArray<React.Element<typeof Cell> | React.Element<typeof GridInner>>
};

/**
 * Use Grid component to display a list of choices, once the handler is triggered.
 */
export const Grid = (props: GridProps) => {
    return <RmwcGrid {...props}>{props.children}</RmwcGrid>;
};
