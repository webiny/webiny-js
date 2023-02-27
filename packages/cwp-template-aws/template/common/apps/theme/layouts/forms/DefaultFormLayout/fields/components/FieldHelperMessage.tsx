import styled from "@emotion/styled";
import { breakpoints, typography, colors } from "../../../../../theme";

export const FieldHelperMessage = styled.div`
  margin-left: 2px;
  margin-bottom: 5px;
  ${typography.paragraph2};
  color: ${colors.color2};

  ${breakpoints["mobile-landscape"]} {
    text-align: left !important;
  }
}
`;
