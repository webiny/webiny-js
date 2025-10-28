import type { CSSProperties } from "react";
import React from "react";
import cn from "classnames";
import type { ColumnProps as AdminUiColumnProps } from "@webiny/admin-ui";
import { Grid as AdminUiGrid } from "@webiny/admin-ui";

export interface RmwcGridProps {
    /** Specifies the grid should have fixed column width. */
    fixedColumnWidth?: boolean;
    /** Specifies the alignment of the whole grid. */
    align?: "left" | "right";
    /** Children for the Grid */
    children?: React.ReactNode;
}

export interface RmwcGridCellProps {
    /** Default number of columns to span. */
    span?: number;
    /** Number of columns to span on a phone. */
    phone?: number;
    /** Number of columns to span on a tablet. */
    tablet?: number;
    /** Number of columns to span on a desktop. */
    desktop?: number;
    /** Specifies the order of the cell. */
    order?: number;
    /** Specifies the alignment of cell */
    align?: "top" | "middle" | "bottom";
}

export type CellProps = RmwcGridCellProps & {
    // One or more Cell components.
    children?: React.ReactNode;

    // CSS class name that will be added to the element
    className?: string;

    style?: { [key: string]: any };
};

/**
 * Cell must be direct children of Grid component.
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Grid` component from the `@webiny/admin-ui` package instead.
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
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Grid` component from the `@webiny/admin-ui` package instead.
 */
export const Grid = (props: GridProps) => {
    const { children, style, className } = props;

    return (
        <AdminUiGrid className={className} style={style}>
            {children as React.ReactElement<AdminUiColumnProps, typeof AdminUiGrid.Column>}
        </AdminUiGrid>
    );
};
