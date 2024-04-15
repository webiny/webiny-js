import React from "react";
import { Header } from "./Header";

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    return (
        <>
            <Header />
            {children}
        </>
    );
};
