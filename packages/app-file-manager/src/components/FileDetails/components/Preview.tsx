import React from "react";
import { Thumbnail } from "./Thumbnail";
import styled from "@emotion/styled";

const PreviewContainer = styled.div`
    height: 60vh;
    background: repeating-conic-gradient(#efefef 0% 25%, transparent 0% 50%) 50%/25px 25px;
`;

export const Preview = () => {
    return (
        <PreviewContainer>
            <Thumbnail />
        </PreviewContainer>
    );
};
