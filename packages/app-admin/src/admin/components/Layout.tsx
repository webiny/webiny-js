import React, { FC, useEffect } from "react";
import { makeComposable } from "@webiny/app-admin";

export interface LayoutProps {
    title?: string;
    children: React.ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children, ...props }) => {
    return <LayoutRenderer {...props}>{children}</LayoutRenderer>;
};

export const LayoutRenderer = makeComposable<LayoutProps>("LayoutRenderer", () => {
    useEffect(() => {
        console.warn(
            `<LayoutRenderer/> is not implemented! To provide an implementation, use the <Compose/> component.`
        );
    }, []);

    return null;
});
