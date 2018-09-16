// @flow
import * as React from "react";

import {
    TopAppBar as RmwcTopAppBar,
    TopAppBarRow,
    TopAppBarSection,
    TopAppBarNavigationIcon,
    TopAppBarTitle,
    TopAppBarActionItem
} from "@rmwc/top-app-bar";

type TopAppBarProps = {
    children: React.Node
};

/**
 * Use TopAppBar component to display navigation for the whole app or just a small section of it.
 * @param props
 * @returns {*}
 * @constructor
 */
const TopAppBar = (props: TopAppBarProps) => {
    const { children, ...other } = props;
    return (
        <RmwcTopAppBar {...other}>
            <TopAppBarRow>{children}</TopAppBarRow>
        </RmwcTopAppBar>
    );
};

type TopAppBarPrimaryProps = {
    children: React.Node
};

const TopAppBarPrimary = (props: TopAppBarPrimaryProps) => {
    const { children, ...other } = props;
    return (
        <TopAppBar {...other} className={"primary"}>
            {children}
        </TopAppBar>
    );
};

type TopAppBarSecondaryProps = {
    children: React.Node,
    style?: Object
};

const TopAppBarSecondary = (props: TopAppBarSecondaryProps) => {
    const { style = {}, children, ...other } = props;
    return (
        <TopAppBar {...other} style={style}>
            {children}
        </TopAppBar>
    );
};

export {
    TopAppBar,
    TopAppBarPrimary,
    TopAppBarSecondary,
    TopAppBarSection,
    TopAppBarNavigationIcon,
    TopAppBarTitle,
    TopAppBarActionItem
};
