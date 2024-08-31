import React from "react";
import { Header } from "./Header";
import styled from "@emotion/styled";
import { useContentSettings } from "../../ContentSettings";

interface LayoutProps {
    children: React.ReactNode;
}

const ContentWrapper = styled.div`
    margin-top: 100px;
`;

export const Layout = ({ children }: LayoutProps) => {
    const { isPreview } = useContentSettings();

    if (isPreview) {
        return <div className="font-sans">{children}</div>;
    }
    return (
        <div className="font-sans">
            <Header />
            <ContentWrapper>{children}</ContentWrapper>
        </div>
    );
};
