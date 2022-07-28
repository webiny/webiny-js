import { css } from "emotion";

export const chipIconWrapper = css({
    ".mdc-chip__icon": {
        "&.mdc-chip__icon--trailing": {
            boxSizing: "border-box",
            display: "flex",
            marginLeft: "4px",
            marginRight: "0px"
        },
        svg: {
            width: 18,
            height: 18
        }
    }
});

export const disabledChips = css({
    opacity: 0.75,
    pointerEvents: "none"
});
