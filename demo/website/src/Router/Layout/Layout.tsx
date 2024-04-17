import React from "react";
import { Header } from "./Header";
import styled from "@emotion/styled";

interface LayoutProps {
    children: React.ReactNode;
    preview?: boolean;
}

const ContentWrapper = styled.div`
    margin-top: 100px;
`;

export const Layout = ({ children, preview = false }: LayoutProps) => {
    if (preview) {
        return <>{children}</>;
    }
    return (
        <>
            <Header />
            <ContentWrapper>{children}</ContentWrapper>
        </>
    );
};
