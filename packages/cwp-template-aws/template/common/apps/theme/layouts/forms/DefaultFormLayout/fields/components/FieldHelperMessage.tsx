import styled from "@emotion/styled";
import theme, { breakpoints, colors } from "../../../../../theme";

export const FieldHelperMessage = styled.div`
  margin-left: 2px;
  margin-bottom: 5px;
  ${theme.styles.typography.paragraphs.byId("paragraph2")};
  color: ${colors.color2};

  ${breakpoints["mobile-landscape"]} {
    text-align: left !important;
  }
}
`;
