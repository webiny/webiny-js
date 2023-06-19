import React from "react";
import { Thumbnail } from "./Thumbnail";
import styled from "@emotion/styled";

const PreviewContainer = styled.div`
    height: calc(100vh - 285px);
    background: repeating-conic-gradient(#efefef 0% 25%, transparent 0% 50%) 50%/25px 25px;
    display: flex;
    width: auto;
    align-items: center;
    justify-content: center;
    > img {
        max-width: 400px;
        max-height: calc(100vh - 350px);
    }
`;

export const Preview = () => {
    return (
        <PreviewContainer>
            <Thumbnail />
        </PreviewContainer>
    );
};
