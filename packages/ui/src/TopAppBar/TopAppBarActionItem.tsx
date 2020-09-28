import * as RMWC from "@rmwc/types";
import * as React from "react";
import {
    TopAppBarActionItem as RmwcTopAppBarActionItem,
    TopAppBarActionItemProps as RmwcTopAppBarActionItemProps
} from "@rmwc/top-app-bar";

export type TopAppBarActionItemProps = RmwcTopAppBarActionItemProps;

const TopAppBarActionItem = <Tag extends React.ElementType<any> = "div">(
    props: RMWC.ComponentProps<TopAppBarActionItemProps, React.HTMLProps<HTMLElement>, Tag>,
    ref: any
) => {
    return <RmwcTopAppBarActionItem {...props} />;
};

export { TopAppBarActionItem };
