import * as React from "react";
import { TopAppBarTitleProps as RmwcTopAppBarTitleProps } from "@rmwc/top-app-bar";
export declare type TopAppBarTitleProps = RmwcTopAppBarTitleProps & {
    /**
     * Element children
     */
    children: React.ReactNode[] | React.ReactNode;
};
declare const TopAppBarTitle: (props: TopAppBarTitleProps) => JSX.Element;
export { TopAppBarTitle };
