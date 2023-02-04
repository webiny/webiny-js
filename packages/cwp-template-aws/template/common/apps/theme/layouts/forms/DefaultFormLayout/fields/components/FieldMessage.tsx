import * as React from "react";
import styled from "@emotion/styled";
import theme from "../../../../../theme";

const Wrapper = styled.div<{ isInvalid: boolean }>`
  margin-left: 2px;
  margin-top: 5px;
  ${theme.styles.typography["paragraph2"]};
  color: ${props =>
      props.isInvalid ? theme.styles.colors["color1"] : theme.styles.colors["color2"]};

  ${theme.breakpoints["mobile-landscape"]} {
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
