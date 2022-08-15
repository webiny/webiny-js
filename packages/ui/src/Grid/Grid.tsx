import React from "react";
import {
    Grid as RmwcGrid,
    GridCell as RmwcGridCell,
    GridRow as RmwcGridInner,
    GridCellProps as RmwcGridCellProps,
    GridProps as RmwcGridProps
} from "@rmwc/grid";
import { CSSProperties } from "react";

export type CellProps = RmwcGridCellProps & {
    // One or more Cell components.
    children?: React.ReactNode;

    // CSS class name that will be added to the element
    className?: string;

    style?: { [key: string]: any };
};

export type GridProps = RmwcGridProps & {
    className?: string;
    style?: CSSProperties;
};

/**
 * Cell must be direct children of Grid component.
 */
export const Cell = (props: CellProps) => {
    return <RmwcGridCell {...props}>{props.children}</RmwcGridCell>;
};

export type GridInnerProps = {
    // One or more Cell components.
    children: React.ReactElement<typeof Cell> | React.ReactElement<typeof Cell>[];

    /**
     * CSS class name
     */
    className?: string;
};

export const GridInner = (props: GridInnerProps) => {
    return <RmwcGridInner {...props}>{props.children}</RmwcGridInner>;
};

GridInner.displayName = "GridInner";

/**
 * Use Grid component to display a list of choices, once the handler is triggered.
 */
export const Grid = (props: GridProps) => {
    return <RmwcGrid {...props}>{props.children}</RmwcGrid>;
};
