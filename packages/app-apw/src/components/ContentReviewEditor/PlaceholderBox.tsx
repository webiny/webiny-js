import React from "react";
import styled from "@emotion/styled";
import { Box } from "~/components/Layout";
import EmptyView from "@webiny/app-admin/components/EmptyView";

const EmptyBox = styled(Box)`
    height: 100%;
    background-color: var(--mdc-theme-on-background);
`;

export const PlaceholderBox: React.FC<{ text: string }> = ({ text }) => {
    return (
        <EmptyBox>
            <EmptyView title={text} action={null} />
        </EmptyBox>
    );
};
