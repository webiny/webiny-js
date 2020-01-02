import * as React from "react";

import {
    TopAppBar as RmwcTopAppBar,
    TopAppBarProps as RmwcTopAppBarProps,
    TopAppBarRow
} from "@rmwc/top-app-bar";

export type TopAppBarProps = RmwcTopAppBarProps & {
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

const TopAppBar = (props: TopAppBarProps) => {
    const { children, ...rest } = props;
    return (
        <RmwcTopAppBar {...rest}>
            <TopAppBarRow>{children}</TopAppBarRow>
        </RmwcTopAppBar>
    );
};

export { TopAppBar };
