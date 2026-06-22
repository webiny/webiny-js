import React from "react";
import styled from "@emotion/styled";

const StyledError = styled.div`
    border: 2px solid var(--color-destructive);
    background-color: var(--color-destructive-muted);
    border-radius: 5px;
    padding: 5px 10px;
`;

interface FieldElementErrorProps {
    title: string;
    description: string;
}

const showError = process.env.NODE_ENV === "development";

export const FieldElementError = (props: FieldElementErrorProps) => {
    if (!showError) {
        return null;
    }

    return (
        <StyledError>
            <h5>{props.title}</h5>
            <p>{props.description}</p>
        </StyledError>
    );
};
