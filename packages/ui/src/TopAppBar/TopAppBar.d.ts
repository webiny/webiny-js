import * as React from "react";
import { TopAppBarProps as RmwcTopAppBarProps } from "@rmwc/top-app-bar";
export declare type TopAppBarProps = RmwcTopAppBarProps & {
    /**
     * Element children
     */
    children: React.ReactNode[] | React.ReactNode;
    /**
     * CSS class name
     */
    className?: string;
    /**
     * Style object
     */
    style?: React.CSSProperties;
};
declare const TopAppBar: (props: TopAppBarProps) => JSX.Element;
export { TopAppBar };
