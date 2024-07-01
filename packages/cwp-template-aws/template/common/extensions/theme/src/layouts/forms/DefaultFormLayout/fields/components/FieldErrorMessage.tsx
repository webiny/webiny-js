import * as React from "react";
import styled from "@emotion/styled";

const Wrapper = styled.div`
    margin-left: 2px;
    margin-top: 5px;
    ${props => props.theme.styles.typography["paragraphs"].stylesById("paragraph2")};
    color: ${props => props.theme.styles.colors["color1"]};

    ${props => props.theme.breakpoints["mobile-landscape"]} {
        text-align: left !important;
    }
`;

interface FieldErrorMessageProps {
    message: React.ReactNode;
    isValid: boolean | null;
}

export const FieldErrorMessage = (props: FieldErrorMessageProps) => {
    return <Wrapper>{props.isValid === false ? props.message : ""}</Wrapper>;
};
