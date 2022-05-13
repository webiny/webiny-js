import React from "react";
import {
    TopAppBarActionItem as RmwcTopAppBarActionItem,
    TopAppBarActionItemProps as RmwcTopAppBarActionItemProps
} from "@rmwc/top-app-bar";

export type TopAppBarActionItemProps = Omit<RmwcTopAppBarActionItemProps, "onChange">;

const TopAppBarActionItem = (props: TopAppBarActionItemProps) => {
    return <RmwcTopAppBarActionItem {...props} />;
};

export { TopAppBarActionItem };
