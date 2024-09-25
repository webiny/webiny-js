import React from "react";
import cn from "classnames";
import { GridCellProps as RmwcGridCellProps, GridProps as RmwcGridProps } from "@rmwc/grid";
import { CSSProperties } from "react";

import { Grid as AdminUiGrid, ColumnProps as AdminUiColumnProps } from "@webiny/admin-ui";

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
    const { children, style, className, align } = props;
    return (
        <AdminUiGrid.Column
            className={className}
            style={style}
            span={props.span as AdminUiColumnProps["span"]}
            align={align}
        >
            {children}
        </AdminUiGrid.Column>
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

export const GridInner = ({ className, ...props }: GridInnerProps) => {
    return (
        <div
            {...props}
            className={cn("grid grid-cols-12 gap-6 m-0 flex flex-wrap items-stretch", className)}
        >
            {props.children}
        </div>
    );
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
        <AdminUiGrid className={className} style={style}>
            {children as React.ReactElement<AdminUiColumnProps, typeof AdminUiGrid.Column>}
        </AdminUiGrid>
    );
};
