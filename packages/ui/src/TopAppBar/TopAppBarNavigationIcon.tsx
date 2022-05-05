import React from "react";

import {
    TopAppBarNavigationIcon as RmwcTopAppBarNavigationIcon,
    TopAppBarNavigationIconProps as RmwcTopAppBarNavigationIconProps
} from "@rmwc/top-app-bar";

export type TopAppBarNavigationIconProps = Omit<RmwcTopAppBarNavigationIconProps, "onChange">;

const TopAppBarNavigationIcon = (props: TopAppBarNavigationIconProps) => {
    return <RmwcTopAppBarNavigationIcon {...props} />;
};

export { TopAppBarNavigationIcon };