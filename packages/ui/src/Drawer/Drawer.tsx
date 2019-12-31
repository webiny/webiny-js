import * as React from "react";
import {
    Drawer as RmwcDrawer,
    DrawerContent as RmwcDrawerContent,
    DrawerHeader as RmwcDrawerHeader,
    DrawerProps as RmwcDrawerProps,
    DrawerHeaderProps,
    DrawerContentProps
} from "@rmwc/drawer";

/**
 * Shows header of the drawer.
 */
const DrawerHeader = (props: DrawerHeaderProps) => <RmwcDrawerHeader {...props} />;

/**
 * Shows drawer content. It can be anything, but commonly a List component would suffice here.
 */
const DrawerContent = (props: DrawerContentProps) => <RmwcDrawerContent {...props} />;

type DrawerProps = RmwcDrawerProps & {
    children: React.ReactNode;
};
/**
 * Use Drawer component to display navigation for the whole app or just a small section of it.
 */
const Drawer = (props: DrawerProps) => {
    return <RmwcDrawer {...props} />;
};

export { Drawer, DrawerHeader, DrawerContent };
