import styled from "@emotion/styled";
import theme from "../../../../../theme";

export const FieldHelperMessage = styled.div`
  margin-left: 2px;
  margin-top: -5px;
  margin-bottom: 5px;
  ${theme.styles.typography.paragraph2};
  color: ${theme.styles.colors.color2};

  ${theme.breakpoints["mobile-landscape"]} {
    text-align: left !important;
  }
}
`;
