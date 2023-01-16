import * as React from "react";
import styled from "@emotion/styled";
import { ReactComponent as Asterisk } from "@material-symbols/svg-400/outlined/emergency.svg";
import theme from "../../../../../theme";

export const FieldLabelStyled = styled.label`
    width: 100%;
    display: inline-block;
    margin: 0 0 5px 1px;

    ${theme.breakpoints.mobile} {
        text-align: left !important;
    }

    svg {
        width: 10px;
        height: 10px;
        fill var(--mdc-theme-primary, #fa5723);
        margin-left: 5px;
        margin-bottom: 5px;
    }
`;

interface FieldLabelProps {
    required?: boolean | null;
}

export const FieldLabel: React.FC<FieldLabelProps> = props => {
    return (
        <FieldLabelStyled>
            {props.children}
            {props.required && <Asterisk />}
        </FieldLabelStyled>
    );
};
