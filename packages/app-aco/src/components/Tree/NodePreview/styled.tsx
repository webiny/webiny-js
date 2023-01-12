import styled from "@emotion/styled";

export const Container = styled("div")`
    background-color: var(--webiny-theme-color-primary);
    border-radius: var(--webiny-theme-border-radius);
    color: var(--webiny-theme-color-on-primary);
    fill: currentColor;
    display: inline-grid;
    grid-template-columns: auto auto;
    align-items: center;
    padding: 4px 8px;
    pointer-events: none;
`;
