import { css } from "emotion";

/**
 * @type {string}
 */
export const webinySelect = css`
    display: grid;
    background-color: transparent;
    border-color: transparent;
    color: var(--webiny-theme-color-primary);
    width: 100%;

    .rmwc-select__native-control {
        opacity: 0;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
    }

    > .mdc-select__anchor {
        width: auto !important;
    }

    &.webiny-ui-select--size-medium {
        &.mdc-select,
        .mdc-select__anchor {
            height: 40px;
            .mdc-select__selected-text {
                font-size: 0.95rem;
            }
        }
    }

    &.webiny-ui-select--size-small {
        &.mdc-select,
        .mdc-select__anchor {
            height: 30px;
            .mdc-select__native-control {
                padding-top: 0;
            }
            .mdc-select__selected-text {
                font-size: 0.9rem;
            }
        }
    }
`;

/**
 * @type {string}
 */
export const noLabel = css`
    &.mdc-select {
        height: 35px;
        .mdc-select__native-control {
            padding-top: 0;
        }
    &.mdc-select--box {
        .mdc-select__native-control {
            height: 35px;
            padding-top: 5px;
        }
    }
`;
