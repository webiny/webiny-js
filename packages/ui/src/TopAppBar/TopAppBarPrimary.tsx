import * as React from "react";
import { TopAppBar, TopAppBarProps } from "./TopAppBar";

export type TopAppBarPrimaryProps = TopAppBarProps;

const TopAppBarPrimary = (props: TopAppBarPrimaryProps) => {
    const { children, ...other } = props;
    return (
        <TopAppBar {...other} className={"primary"}>
            {children}
        </TopAppBar>
    );
};

export { TopAppBarPrimary };
