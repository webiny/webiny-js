import * as React from "react";
import {
    TopAppBarSection as RmwcTopAppBarSection,
    TopAppBarSectionProps as RmwcTopAppBarSectionProps
} from "@rmwc/top-app-bar";

export type TopAppBarSectionProps = RmwcTopAppBarSectionProps & {
    /**
     * Element children
     */
    children: React.ReactNode[] | React.ReactNode;
};

const TopAppBarSection = (props: TopAppBarSectionProps) => {
    const { children, ...rest } = props;
    return <RmwcTopAppBarSection {...rest}>{children}</RmwcTopAppBarSection>;
};

export { TopAppBarSection };
