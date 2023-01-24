import React from "react";
import { makeComposable } from "@webiny/app-core";

export interface LayoutProps {
    title?: string;
    children: React.ReactNode;
}

export const Layout = makeComposable<LayoutProps>("Layout", ({ children, ...props }) => {
    return <LayoutRenderer {...props}>{children}</LayoutRenderer>;
});

export const LayoutRenderer = makeComposable<LayoutProps>("LayoutRenderer");
