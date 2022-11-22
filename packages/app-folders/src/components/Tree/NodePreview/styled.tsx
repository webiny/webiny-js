import styled from "@emotion/styled";

export const Container = styled("div")`
    align-items: center;
    background-color: var(--webiny-theme-color-primary);
    border-radius: var(--webiny-theme-border-radius);
    color: var(--webiny-theme-color-on-primary);
    display: inline-grid;
    gap: 8px;
    grid-template-columns: auto auto;
    padding: 4px 8px;
    pointer-events: none;
    fill: currentColor;
`;
