import React from "react";
import styled from "@emotion/styled";
import { Box } from "~/admin/components/Layout";

const EmptyBox = styled(Box)`
    height: 100%;
    background-color: var(--mdc-theme-on-background);
`;

export function PlaceholderBox() {
    return <EmptyBox />;
}
