import { css } from "emotion";

export const chipIconWrapper = css({
    ".mdc-chip__icon": {
        svg: {
            width: 18,
            height: 18,
            "&.mdc-chip__icon--trailing": {
                boxSizing: "border-box",
                display: "flex"
            }
        }
    }
});


export const disabledChips = css({
    opacity: 0.75,
    pointerEvents: "none"
});
