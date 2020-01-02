import * as React from "react";
import { TopAppBar } from "./TopAppBar";

export type TopAppBarPrimaryProps = {
    /**
     * Element children
     */
    children: React.ReactNode;
};

const TopAppBarPrimary = (props: TopAppBarPrimaryProps) => {
    const { children, ...other } = props;
    return (
        <TopAppBar {...other} className={"primary"}>
            {children}
        </TopAppBar>
    );
};

export { TopAppBarPrimary };
