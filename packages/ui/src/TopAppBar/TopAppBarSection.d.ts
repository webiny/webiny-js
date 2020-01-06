import * as React from "react";
import { TopAppBarSectionProps as RmwcTopAppBarSectionProps } from "@rmwc/top-app-bar";
export declare type TopAppBarSectionProps = RmwcTopAppBarSectionProps & {
    /**
     * Element children
     */
    children: React.ReactNode[] | React.ReactNode;
    /**
     * Style object.
     */
    style?: React.CSSProperties;
    /**
     * CSS class name.
     */
    className?: string;
};
declare const TopAppBarSection: (props: TopAppBarSectionProps) => JSX.Element;
export { TopAppBarSection };
