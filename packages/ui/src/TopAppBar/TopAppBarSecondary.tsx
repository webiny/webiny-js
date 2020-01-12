import * as React from "react";
import { TopAppBar, TopAppBarProps } from "./TopAppBar";

export type TopAppBarSecondaryProps = TopAppBarProps;

const TopAppBarSecondary = (props: TopAppBarSecondaryProps) => {
    const { style = {}, children, ...other } = props;
    return (
        <TopAppBar {...other} style={style}>
            {children}
        </TopAppBar>
    );
};

export { TopAppBarSecondary };
