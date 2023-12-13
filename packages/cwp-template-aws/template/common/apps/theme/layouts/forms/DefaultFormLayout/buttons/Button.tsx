import React from "react";
import styled from "@emotion/styled";
import { FormRenderPropParamsSubmit } from "@webiny/form";

export const Wrapper = styled.div<{ fullWidth: boolean; type: "primary" | "default" }>`
    ${({ theme, type }) => theme.styles.elements["button"][`${type}`]}
    .button-body {
        width: ${props => (props.fullWidth ? "100%" : "auto")};
        margin-left: auto;

        &:disabled {
            opacity: 0.5;
        }
    }
`;

interface Props {
    fullWidth: boolean;
    disabled: boolean;
    children: React.ReactNode;
    type?: "primary" | "default";
    onClick: FormRenderPropParamsSubmit | (() => void);
}

export const Button = ({ fullWidth, disabled, children, type = "default", onClick }: Props) => {
    return (
        <Wrapper fullWidth={fullWidth} type={type}>
            <button className={"button-body"} onClick={onClick} disabled={disabled}>
                {children}
            </button>
        </Wrapper>
    );
};
