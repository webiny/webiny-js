import React from "react";
import styled from "@emotion/styled";

const EmptyElementWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 100px;
    ${props => props.theme.styles.typography.paragraphs.stylesById("paragraph1")};
    color: ${props => props.theme.styles.colors["color4"]};
`;

type EmptyElementProps = {
    message: string;
};

export const EmptyElement = ({ message }: EmptyElementProps) => {
    return <EmptyElementWrapper>{message}</EmptyElementWrapper>;
};
