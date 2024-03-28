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

    > .mdc-select__anchor {
        width: auto !important;
    }

    &.webiny-ui-select--size-medium {
        &.mdc-select,
        .mdc-select__anchor {
            height: 40px;
            .mdc-select__native-control {
                paddingtop: 0;
            }
            .mdc-select__dropdown-icon {
                bottom: 8px;
            }
            .mdc-select__selected-text {
                padding-top: 6px !important;
                padding-left: 10px;
                font-size: 0.95rem;
                height: 40px;
            }

            &.mdc-select--box {
                .mdc-select__native-control {
                    height: 40px;
                    paddingtop: 5px;
                }
            }
        }
    }

    &.webiny-ui-select--size-small {
        &.mdc-select,
        .mdc-select__anchor {
            height: 30px;
            .mdc-select__native-control {
                paddingtop: 0;
            }
            .mdc-select__dropdown-icon {
                bottom: 3px;
            }
            .mdc-select__selected-text {
                padding-top: 1px !important;
                padding-left: 10px;
                font-size: 0.9rem;
                height: 30px;
            }
            &.mdc-select--box {
                .mdc-select__native-control {
                    height: 30px;
                    paddingtop: 5px;
                }
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
            paddingTop: 0;
        }
    &.mdc-select--box {
        .mdc-select__native-control {
            height: 35px;
            paddingTop: 5px;
        }
    }
`;
