import React, { Fragment } from "react";
import styled from "@emotion/styled";
import { useFileManagerViewConfig } from "~/index";

const ActionsContainer = styled.div`
    text-align: center;
    border-bottom: 1px solid var(--mdc-theme-on-background);
`;

export const Actions = () => {
    const { fileDetails } = useFileManagerViewConfig();

    return (
        <ActionsContainer>
            {fileDetails.actions.map(action => (
                <Fragment key={action.name}>{action.element}</Fragment>
            ))}
        </ActionsContainer>
    );
};
