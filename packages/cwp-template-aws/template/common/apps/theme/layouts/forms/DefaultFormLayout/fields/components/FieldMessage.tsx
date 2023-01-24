import * as React from "react";
import styled from "@emotion/styled";
import { breakpoints, typography, colors } from "../../../../../theme";

const Wrapper = styled.div<{ isInvalid: boolean }>`
  margin-left: 2px;
  margin-top: 5px;
  ${typography.paragraph2};
  color: ${props => (props.isInvalid ? colors.color1 : colors.color2)};

  ${breakpoints["mobile-landscape"]} {
    text-align: left !important;
  }
}
`;

interface HelperMessageProps {
    helperMessage?: React.ReactNode;
    errorMessage: React.ReactNode;
    isValid: boolean | null;
}

/**
 * A component that is used to show helper (description) and validation error messages.
 */
export const FieldMessage: React.FC<HelperMessageProps> = props => {
    return (
        <Wrapper isInvalid={props.isValid === false}>
            {props.isValid === false ? props.errorMessage : props.helperMessage}
        </Wrapper>
    );
};
