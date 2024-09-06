import React from "react";
import {
    GridRow as RmwcGridInner,
    GridCellProps as RmwcGridCellProps,
    GridProps as RmwcGridProps
} from "@rmwc/grid";
import { CSSProperties } from "react";

import {
    Grid as AdminUiGrid,
    Column as AdminUiColumn,
    ColumnProps as AdminUiColumnProps
} from "@webiny/admin-ui";

export type CellProps = RmwcGridCellProps & {
    // One or more Cell components.
    children?: React.ReactNode;

    // CSS class name that will be added to the element
    className?: string;

    style?: { [key: string]: any };
};

/**
 * Cell must be direct children of Grid component.
 */
export const Cell = (props: CellProps) => {
    const { children, style, className } = props;
    return (
        <AdminUiColumn
            content={children}
            className={className}
            style={style}
            span={props.span as AdminUiColumnProps["span"]}
        />
    );
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

export type GridProps = RmwcGridProps & {
    className?: string;
    style?: CSSProperties;
};

/**
 * Use Grid component to display a list of choices, once the handler is triggered.
 */
export const Grid = (props: GridProps) => {
    const { children, style, className } = props;

    return (
        <AdminUiGrid
            content={children as React.ReactElement<AdminUiColumnProps, typeof AdminUiColumn>}
            className={className}
            style={style}
        />
    );
    // return <RmwcGrid {...props}>{props.children}</RmwcGrid>;
};

// TODO: responsive
// TODO: grid inner
