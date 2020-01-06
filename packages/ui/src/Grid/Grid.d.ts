import * as React from "react";
import { GridCellProps as RmwcGridCellProps, GridProps as RmwcGridProps } from "@rmwc/grid";
export declare type CellProps = RmwcGridCellProps & {
    children?: React.ReactNode;
    className?: string;
    style?: {
        [key: string]: any;
    };
};
export declare type GridProps = RmwcGridProps & {
    className?: string;
};
/**
 * Cell must be direct children of Grid component.
 */
export declare const Cell: (props: CellProps) => JSX.Element;
export declare type GridInnerProps = {
    children: React.ReactElement<typeof Cell>[];
    /**
     * CSS class name
     */
    className?: string;
};
export declare const GridInner: {
    (props: GridInnerProps): JSX.Element;
    displayName: string;
};
/**
 * Use Grid component to display a list of choices, once the handler is triggered.
 */
export declare const Grid: (props: GridProps) => JSX.Element;
