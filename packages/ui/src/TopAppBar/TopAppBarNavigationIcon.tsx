import * as RMWC from "@rmwc/types";
import * as React from "react";

import {
    TopAppBarNavigationIcon as RmwcTopAppBarNavigationIcon,
    TopAppBarNavigationIconProps as RmwcTopAppBarNavigationIconProps
} from "@rmwc/top-app-bar";

export type TopAppBarNavigationIconProps = RmwcTopAppBarNavigationIconProps;

const TopAppBarNavigationIcon = <Tag extends React.ElementType<any> = "div">(
    props: RMWC.ComponentProps<TopAppBarNavigationIconProps, React.HTMLProps<HTMLElement>, Tag>,
    ref: any
) => {
    return <RmwcTopAppBarNavigationIcon {...props} />;
};

export { TopAppBarNavigationIcon };
