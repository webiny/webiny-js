import * as React from "react";
import styled from "@emotion/styled";
import { breakpoints, typography, colors } from "../../../../../theme";

const Wrapper = styled.div`
  margin-left: 2px;
  margin-top: 5px;
  ${typography.paragraph2};
  color: ${colors.color1};

  ${breakpoints["mobile-landscape"]} {
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
