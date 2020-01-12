import * as React from "react";

import {
    TopAppBarNavigationIcon as RmwcTopAppBarNavigationIcon,
    TopAppBarNavigationIconProps as RmwcTopAppBarNavigationIconProps
} from "@rmwc/top-app-bar";

export type TopAppBarNavigationIconProps = RmwcTopAppBarNavigationIconProps;

const TopAppBarNavigationIcon = (props: TopAppBarNavigationIconProps) => {
    return <RmwcTopAppBarNavigationIcon {...props} />;
};

export { TopAppBarNavigationIcon };
