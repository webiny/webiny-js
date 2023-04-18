import React from "react";
import mime from "mime/lite";
import styled from "@emotion/styled";

mime.define({ "image/x-icon": ["ico"] }, true);
mime.define({ "image/jpg": ["jpg"] }, true);
mime.define({ "image/vnd.microsoft.icon": ["ico"] }, true);

const BottomInfoBarWrapper = styled.div`
    font-size: 0.8rem;
    position: sticky;
    bottom: 0px;
    height: 30px;
    color: var(--mdc-theme-text-secondary-on-background);
    border-top: 1px solid var(--mdc-theme-on-background);
    background-color: var(--mdc-theme-surface);
    width: 100%;
    transform: translateZ(0);
    overflow: hidden;
    display: flex;
    align-items: center;
    z-index: 1;
    > div {
        position: relative;
        width: 100%;
        height: 100%;
    }
`;

export interface BottomInfoBarProps {
    children?: React.ReactNode;
}

const BottomInfoBar = ({ children }: BottomInfoBarProps) => {
    return (
        <BottomInfoBarWrapper>
            <div>{children}</div>
        </BottomInfoBarWrapper>
    );
};

export default BottomInfoBar;
