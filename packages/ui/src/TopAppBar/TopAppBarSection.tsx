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

    /**
     * Style object.
     */
    style?: React.CSSProperties;

    /**
     * CSS class name.
     */
    className?: string;
};

const TopAppBarSection = (props: TopAppBarSectionProps) => {
    const { children, ...rest } = props;
    return <RmwcTopAppBarSection {...rest}>{children}</RmwcTopAppBarSection>;
};

export { TopAppBarSection };
