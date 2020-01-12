import * as React from "react";
import {
    TopAppBarActionItem as RmwcTopAppBarActionItem,
    TopAppBarActionItemProps as RmwcTopAppBarActionItemProps
} from "@rmwc/top-app-bar";

export type TopAppBarActionItemProps = RmwcTopAppBarActionItemProps;

const TopAppBarActionItem = (props: TopAppBarActionItemProps) => {
    return <RmwcTopAppBarActionItem {...props} />;
};

export { TopAppBarActionItem };
