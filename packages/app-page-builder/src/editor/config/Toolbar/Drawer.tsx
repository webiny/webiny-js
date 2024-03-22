import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import classNames from "classnames";
import { DrawerContent, DrawerLeft } from "@webiny/ui/Drawer";
import { useDrawer } from "./DrawerProvider";

const DrawerContainer = styled("div")<{ open: boolean }>(({ open }) => ({
    pointerEvents: open ? "all" : "none",
    ".mdc-drawer__drawer": {
        "> .mdc-list": {
            padding: 0
        }
    }
}));

const drawerStyle = css({
    zIndex: 10,
    "&.mdc-drawer--dismissible": {
        marginLeft: 54,
        position: "fixed",
        top: 64,
        height: "calc(100vh - 64px)",
        width: "280px !important",
        maxWidth: "280px !important",
        ".mdc-drawer__content": {
            width: "100%"
        }
    }
});

export interface DrawerProps {
    children: React.ReactNode;
    drawerClassName?: string;
}

export const Drawer = ({ children, drawerClassName }: DrawerProps) => {
    const { isOpen, close } = useDrawer();

    return (
        <DrawerContainer open={isOpen}>
            <DrawerLeft
                dismissible
                open={isOpen}
                onClose={close}
                className={classNames(drawerStyle, drawerClassName)}
            >
                <DrawerContent>{children}</DrawerContent>
            </DrawerLeft>
        </DrawerContainer>
    );
};
