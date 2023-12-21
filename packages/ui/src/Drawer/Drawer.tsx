import React, { useMemo } from "react";
import { CSSObject } from "@emotion/react";
import styled from "@emotion/styled";
import {
    Drawer as RmwcDrawer,
    DrawerContent as RmwcDrawerContent,
    DrawerHeader as RmwcDrawerHeader,
    DrawerProps as RmwcDrawerProps,
    DrawerHeaderProps as RmwcDrawerHeaderProps,
    DrawerContentProps as RmwcDrawerContentProps
} from "@rmwc/drawer";

type DrawerHeaderProps = RmwcDrawerHeaderProps & {
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
 * Shows header of the drawer.
 */
const DrawerHeader = (props: DrawerHeaderProps) => <RmwcDrawerHeader {...props} />;

export type DrawerContentProps = RmwcDrawerContentProps & {
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
     * Drawer content.
     */
    children: React.ReactNode;

    /**
     * CSS class name
     */
    className?: string;

    style?: CSSObject;
};

const DirectionRTL = styled.div`
    .mdc-drawer.mdc-drawer--modal,
    .mdc-drawer.mdc-drawer--dismissable {
        left: initial;
        right: 0;
    }

    .mdc-drawer--animate {
        -webkit-transform: translateX(100%);
        transform: translateX(100%);
    }

    .mdc-drawer.mdc-drawer--opening {
        -webkit-transform: translateX(0%) !important;
        transform: translateX(0%) !important;
    }

    .mdc-drawer.mdc-drawer--closing {
        -webkit-transform: translateX(100%) !important;
        transform: translateX(100%) !important;
    }
`;

/**
 * Use Drawer component to display navigation for the whole app or just a small section of it.
 */
const Drawer = ({ style, children, ...props }: DrawerProps) => {
    // Style the drawer using the styles that were passed in.
    const Drawer = useMemo(() => (style ? styled(RmwcDrawer)(style) : RmwcDrawer), [style]);

    return <Drawer {...props}>{children}</Drawer>;
};

const DrawerRight = (props: DrawerProps) => {
    return (
        <DirectionRTL>
            <Drawer {...props} />
        </DirectionRTL>
    );
};

const DrawerLeft = (props: DrawerProps) => {
    return <Drawer {...props} />;
};

export { Drawer, DrawerHeader, DrawerContent, DrawerRight, DrawerLeft };
