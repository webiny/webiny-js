import React from "react";

import styled from "@emotion/styled";
import theme from "../../../theme";

export const Cell = styled.div`
  display: flex;
  width: 100%;
  background-color: ${theme.styles.colors.color5};
  padding: 15px;

  ${theme.breakpoints.desktop} {
    &:first-child {
      padding-left: 0;
    }

    &:last-child {
      padding-right: 0;
    }
  }
}
`;
