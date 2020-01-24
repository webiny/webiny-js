import * as React from "react";
import {
    Drawer as RmwcDrawer,
    DrawerContent as RmwcDrawerContent,
    DrawerHeader as RmwcDrawerHeader,
    DrawerProps as RmwcDrawerProps,
    DrawerHeaderProps as RmwcDrawerHeaderProps,
    DrawerContentProps as RmwcDrawerContentProps
} from "@rmwc/drawer";

type DrawerHeaderProps = RmwcDrawerHeaderProps & {
    children: any;
    className?: string;
};

/**
 * Shows header of the drawer.
 */
const DrawerHeader = (props: DrawerHeaderProps) => <RmwcDrawerHeader {...props} />;

export type DrawerContentProps = RmwcDrawerContentProps & {
    /**
     * Drawer direction.
     */
    dir?: string;
    /**
     * Drawer content.
     */
    children: React.ReactNode;

    /**
     * CSS class name
     */
    className?: string;
};

/**
 * Shows drawer content. It can be anything, but commonly a List component would suffice here.
 */
const DrawerContent = (props: DrawerContentProps) => <RmwcDrawerContent {...props} />;

type DrawerProps = RmwcDrawerProps & {
    /**
     * Drawer direction.
     */
    dir?: string;
    /**
     * Drawer content.
     */
    children: React.ReactNode;

    /**
     * CSS class name
     */
    className?: string;
};
/**
 * Use Drawer component to display navigation for the whole app or just a small section of it.
 */
const Drawer = (props: DrawerProps) => {
    return <RmwcDrawer {...props} />;
};

export { Drawer, DrawerHeader, DrawerContent };
