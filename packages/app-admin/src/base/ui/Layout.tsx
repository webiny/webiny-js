import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/app";

export interface LayoutProps {
    title?: string;
    startElement?: React.ReactNode;
    hideNavigation?: boolean;
    children: React.ReactNode;
}

export const Layout = makeDecoratable("Layout", ({ children, ...props }: LayoutProps) => {
    return <LayoutRenderer {...props}>{children}</LayoutRenderer>;
});

export const LayoutRenderer = makeDecoratable("LayoutRenderer", createVoidComponent<LayoutProps>());

/** The decoratable admin frame (header, navigation, content), for extensions that replace it. */
export const LayoutComponent = LayoutRenderer;
