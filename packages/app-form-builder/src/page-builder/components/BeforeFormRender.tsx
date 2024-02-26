import React from "react";
import { usePageElements } from "@webiny/app-page-builder-elements";
import styled from "@emotion/styled";

interface BeforeFormRenderProps {
    message: React.ReactNode;
    border?: boolean;
}

export const BeforeFormRender = React.memo(function BeforeFormRender({
    message,
    border
}: BeforeFormRenderProps) {
    const { theme } = usePageElements();
    const Before = styled.div`
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100px;
        width: 100%;
        box-sizing: border-box;
        pointer-events: none;
        text-align: center;
        ${border !== false && `border: 1px dashed ${theme.styles.colors["color2"]};`}
        ${theme.styles.typography.paragraphs.stylesById("paragraph1")};
        color: ${theme.styles.colors["color4"]};
    `;

    return (
        <Before>
            <div>{message}</div>
        </Before>
    );
});
