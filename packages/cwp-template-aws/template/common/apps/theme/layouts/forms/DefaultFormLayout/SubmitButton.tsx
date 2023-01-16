import React from "react";
import { FormRenderPropParamsSubmit } from "@webiny/form";
import styled from "@emotion/styled";
import theme from "./../../../theme";

export const Wrapper = styled.div([
    theme.styles.elements["button"]["primary"],
    {
        ".button-body": {
            width: "100%",
            "&:disabled": {
                opacity: 0.5
            }
        }
    }
]);

interface Props {
    onClick: FormRenderPropParamsSubmit;
    loading: boolean;
    children: React.ReactNode;
}

export const SubmitButton: React.FC<Props> = ({ onClick, loading, children }) => {
    return (
        <Wrapper>
            <button className={"button-body"} onClick={onClick} disabled={loading}>
                {children}
            </button>
        </Wrapper>
    );
};
