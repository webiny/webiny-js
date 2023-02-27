import styled from "@emotion/styled";
import theme from "../../../theme";

export const Cell = styled.div`
  width: 100%;
  background-color: ${theme.styles.colors["color6"]};
  padding: 15px;

  ${theme.breakpoints["desktop"]} {
    &:first-of-type {
      padding-left: 0;
    }

    &:last-child {
      padding-right: 0;
    }
  }
}
`;
