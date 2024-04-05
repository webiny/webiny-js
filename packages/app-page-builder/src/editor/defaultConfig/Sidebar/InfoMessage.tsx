import React, { ReactElement } from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";

const InfoMessageContainer = styled.div`
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 48px 16px;
    background-color: var(--mdc-theme-background);
    color: var(--mdc-theme-text-primary-on-background);
    max-height: 150px;
    & .icon {
        fill: var(--mdc-theme-text-icon-on-background);
        width: 36px;
        height: 36px;
    }
    & .text {
        margin-top: 16px;
        color: var(--mdc-theme-text-on-background);
        text-align: center;
    }
`;

export interface InfoMessageProps {
    message: string;
    icon?: ReactElement;
}

export const InfoMessage = ({ message, icon }: InfoMessageProps) => {
    return (
        <InfoMessageContainer>
            {icon && React.cloneElement(icon, { className: "icon" })}
            <Typography use={"subtitle1"} className={"text"}>
                {message}
            </Typography>
        </InfoMessageContainer>
    );
};
