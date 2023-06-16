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
    &.webiny-ui-select--small {
        &.mdc-select, .mdc-select__anchor {
            height: 35px;
            .mdc-select__native-control {
                paddingTop: 0;
            }
            .mdc-select__selected-text{
                padding-top: 5px;
            }
            .mdc-select__dropdown-icon{
                bottom: 5px;
            }
            .mdc-select__selected-text{
                padding-top: 5px !important;
                padding-left: 10px;
            }
        &.mdc-select--box {
            .mdc-select__native-control {
                height: 35px;
                paddingTop: 5px;
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