// @flow
import * as React from "react";
import {
    Drawer as RmwcDrawer,
    DrawerContent as RmwcDrawerContent,
    DrawerHeader as RmwcDrawerHeader
} from "@rmwc/drawer";

/**
 * Shows header of the drawer.
 * @param props
 * @returns {*}
 * @constructor
 */
const DrawerHeader = (props: Object) => <RmwcDrawerHeader {...props} />;

/**
 * Shows drawer content. It can be anything, but commonly a List component would suffice here.
 * @param props
 * @returns {*}
 * @constructor
 */
const DrawerContent = (props: Object) => <RmwcDrawerContent {...props} />;

type Props = {
    // DrawerHeader and DrawerContent components (both can receive any React.Node as children).
    children: React.Node,

    // If true, drawer will be permanently fixed inside of a view (works for temporary and persistent modes).
    open?: boolean,

    // Makes a modal / temporary drawer.
    modal?: boolean,

    // Makes a dismissible drawer.
    dismissible?: boolean
};

/**
 * Use Drawer component to display navigation for the whole app or just a small section of it.
 * @param props
 * @returns {*}
 * @constructor
 */
const Drawer = (props: Props) => {
    return <RmwcDrawer {...props} />;
};

export { Drawer, DrawerHeader, DrawerContent };
