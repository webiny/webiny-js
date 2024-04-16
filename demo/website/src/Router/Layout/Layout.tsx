import React from "react";
import { Header } from "./Header";

interface LayoutProps {
    children: React.ReactNode;
    preview?: boolean;
}

export const Layout = ({ children, preview = false }: LayoutProps) => {
    if (preview) {
        return <>{children}</>;
    }
    return (
        <>
            <Header />
            {children}
        </>
    );
};
