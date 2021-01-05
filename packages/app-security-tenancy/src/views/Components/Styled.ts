import { css } from "emotion";

export const actionButtonStyle = css({
    "&.mdc-snackbar__action:not(:disabled)": {
        color: "var(--mdc-theme-primary)",
        "&::before": {
            backgroundColor: "var(--mdc-theme-primary)"
        },
        "&::after": {
            backgroundColor: "var(--mdc-theme-primary)"
        }
    }
});
