import styled from "@emotion/styled";
import React from "react";

const Row = styled.div`
    display: flex;
    flex-direction: row;
`;

const Column = styled.div`
    flex-grow: 1;
`;

export const FlexRow = ({ children }: { children: React.ReactNode }) => {
    return <Row>{children}</Row>;
};

export const FlexColumn = ({ children }: { children: React.ReactNode }) => {
    return <Column>{children}</Column>;
};
