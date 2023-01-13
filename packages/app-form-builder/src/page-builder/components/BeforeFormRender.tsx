import React from "react";
import { usePageElements } from "@webiny/app-page-builder-elements";
import styled from "@emotion/styled";

export const BeforeFormRender: React.VFC<{ message: React.ReactNode; border?: boolean }> =
    React.memo(({ message, border }) => {
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
            ${border !== false && `border: 1px dashed ${theme.styles.colors.color2};`}
            ${theme.styles.typography.paragraph1};
            color: ${theme.styles.colors.color4};
        `;

        return (
            <Before>
                <div>{message}</div>
            </Before>
        );
    });
