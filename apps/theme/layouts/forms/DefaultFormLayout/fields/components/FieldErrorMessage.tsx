import * as React from "react";
import styled from "@emotion/styled";
import theme from "../../../../../theme";

const Wrapper = styled.div`
  margin-left: 2px;
  margin-top: 5px;
  ${theme.styles.typography.paragraph2};
  color: ${theme.styles.colors.color1};

  ${theme.breakpoints["mobile-landscape"]} {
    text-align: left !important;
  }
}
`;

interface FieldErrorMessageProps {
    message: React.ReactNode;
    isValid: boolean | null;
}

export const FieldErrorMessage: React.FC<FieldErrorMessageProps> = props => {
    return <Wrapper>{props.isValid === false ? props.message : ""}</Wrapper>;
};
