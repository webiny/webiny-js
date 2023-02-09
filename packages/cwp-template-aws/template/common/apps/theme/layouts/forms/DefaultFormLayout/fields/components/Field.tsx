import styled from "@emotion/styled";
import theme from "../../../../../theme";

export const Field = styled.div`
    width: 100%;
    box-sizing: border-box;
    ${theme.styles.typography["paragraph1"]};
    background-color: var(--webiny-theme-color-surface, #ffffff);
`;
