import React from "react";
import styled from "@emotion/styled";
import { TypeAndSize } from "./TypeAndSize";
import { CreatedOn } from "./CreatedOn";

const PreviewMetaWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px;
    border-top: 1px solid var(--mdc-theme-on-background);
`;

export const PreviewMeta = () => {
    return (
        <PreviewMetaWrapper>
            <TypeAndSize />
            <CreatedOn />
        </PreviewMetaWrapper>
    );
};
