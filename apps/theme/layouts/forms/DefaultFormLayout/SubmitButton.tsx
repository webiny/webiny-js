import React from "react";
import { FormRenderPropParamsSubmit } from "@webiny/form";
import styled from "@emotion/styled";

export const Wrapper = styled.div<{ fullWidth: boolean }>`
    ${props => props.theme.styles.elements["button"]["primary"]}
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
    onClick: FormRenderPropParamsSubmit;
    loading: boolean;
    children: React.ReactNode;
}

export const SubmitButton: React.FC<Props> = ({ fullWidth, onClick, loading, children }) => {
    return (
        <Wrapper fullWidth={fullWidth}>
            <button className={"button-body"} onClick={onClick} disabled={loading}>
                {children}
            </button>
        </Wrapper>
    );
};
