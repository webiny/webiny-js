import * as React from "react";
import {
    TopAppBarTitle as RmwcTopAppBarTitle,
    TopAppBarTitleProps as RmwcTopAppBarTitleProps
} from "@rmwc/top-app-bar";

export type TopAppBarTitleProps = RmwcTopAppBarTitleProps & {
    /**
     * Element children
     */
    children: React.ReactNode[] | React.ReactNode;
};

const TopAppBarTitle = (props: TopAppBarTitleProps) => {
    const { children, ...rest } = props;
    return <RmwcTopAppBarTitle {...rest}>{children}</RmwcTopAppBarTitle>;
};

export { TopAppBarTitle };
