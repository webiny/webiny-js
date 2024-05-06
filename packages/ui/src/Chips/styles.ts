import { css } from "emotion";

export const chipIconWrapper = css({
    ".mdc-evolution-chip__text-label": {
        display: "flex",
        alignItems: "center",
        ".mdc-chip__icon": {
            svg: {
                width: 18,
                height: 18
            }
        }
    }
});

export const disabledChips = css({
    opacity: 0.75,
    pointerEvents: "none"
});
