import styled from "@emotion/styled";
import { css } from "emotion";

export const fieldsWrapperStyle = css`
    border-left: 2px solid var(--mdc-theme-on-background);
    padding-left: 16px;

    &:focus-within {
        border-color: var(--mdc-theme-primary);
    }
`;

export const dynamicSectionTitleStyle = css`
    margin-top: 24px;
`;

export const dynamicSectionGridStyle = css`
    & > .mdc-layout-grid__inner {
        grid-gap: 8px;
    }
`;

export const fieldsGridStyle = css`
    &.mdc-layout-grid {
        padding: 8px;
    }
`;

export const ObjectItem = styled.div`
    position: relative;
`;

export const ItemHighLight = styled("div")({
    "&": {
        opacity: 0,
        animation: "wf-blink-in 1s",
        border: "2px solid var(--mdc-theme-secondary)",
        boxShadow: "0 0 15px var(--mdc-theme-secondary)",
        backgroundColor: "rgba(42, 217, 134, 0.25)",
        borderRadius: "2px",
        position: "absolute",
        top: 0,
        left: -12,
        right: -8,
        bottom: 0,
        zIndex: 1,
        pointerEvents: "none"
    },
    "@keyframes wf-blink-in": { "40%": { opacity: 1 } }
});
