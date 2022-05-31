import { css } from "emotion";

/**
 * Controls the button styles
 * @type {string}
 */
const webinyButtonStyles = css(
    {},
    {
        "&.webiny-ui-button--secondary:not(:disabled)": {
            borderColor: 'var(--mdc-theme-primary)'
        }
    }
);

export { webinyButtonStyles };
