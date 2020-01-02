import * as React from "react";
import { TopAppBar } from "./TopAppBar";

export type TopAppBarSecondaryProps = {
    /**
     * Element children
     */
    children: React.ReactNode;
    /**
     * Style object
     */
    style?: Object;
};

const TopAppBarSecondary = (props: TopAppBarSecondaryProps) => {
    const { style = {}, children, ...other } = props;
    return (
        <TopAppBar {...other} style={style}>
            {children}
        </TopAppBar>
    );
};

export { TopAppBarSecondary };
