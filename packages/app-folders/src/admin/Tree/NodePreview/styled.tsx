import { css } from "@emotion/css";

export const Container = css`
    align-items: center;
    background-color: var(--webiny-theme-color-primary);
    border-radius: var(--webiny-theme-border-radius);
    box-shadow: 0 12px 24px -6px var(--webiny-theme-color-border);
    color: var(--webiny-theme-color-on-primary);
    display: inline-grid;
    gap: 8px;
    grid-template-columns: auto auto;
    padding: 4px 8px;
    pointer-events: none;
    fill: currentColor;
`;
