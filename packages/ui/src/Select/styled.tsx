import { css } from "emotion";

/**
 * @type {string}
 */
export const webinySelect = css`
    display: grid;
    background-color: transparent;
    border-color: transparent;
    color: var(--webiny-theme-color-primary);

    .rmwc-select__native-control {
        opacity: 0;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
    }
`;
