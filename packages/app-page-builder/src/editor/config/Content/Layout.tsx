import React from "react";
import { css } from "emotion";
import { Elevation } from "@webiny/ui/Elevation";

export interface LayoutProps {
    className?: string;
    children: React.ReactNode;
}

const contentContainerWrapper = css`
    margin: 95px 65px 50px 85px;
    padding: 0;
    position: absolute;
    width: calc(100vw - 415px);
    top: 0;
    box-sizing: border-box;
    z-index: 1;
`;

export const Layout = ({ className = contentContainerWrapper, children }: LayoutProps) => {
    return (
        <Elevation className={className} z={0}>
            {children}
        </Elevation>
    );
};
