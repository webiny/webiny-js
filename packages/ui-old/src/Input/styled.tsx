import { css } from "emotion";

/**
 * @type {string}
 */
export const webinyInputStyles = css`
    //  fix label position when autofilled

    .mdc-text-field__input:-webkit-autofill + .mdc-floating-label {
        transform: translateY(-106%) scale(0.75);
    }

    .mdc-floating-label {
        margin-left: 0 !important;
    }

    .mdc-text-field__input::-webkit-calendar-picker-indicator {
        display: initial;
    }

    // medium input styles
    &.webiny-ui-input--size-medium {
        &.mdc-text-field {
            height: 40px;
            font-size: 0.85em;
        }
    }

    // small input styles
    &.webiny-ui-input--size-small {
        &.mdc-text-field {
            height: 30px;
            font-size: 0.75em;
        }
    }

    // textarea
    &.mdc-text-field--textarea {
        display: flex;
        flex-direction: row;

        &.mdc-text-field--with-trailing-icon {
            padding-left: 0;
            padding-right: 0;

            .mdc-text-field__input {
                padding-right: 0;
            }
        }
    }
`;
