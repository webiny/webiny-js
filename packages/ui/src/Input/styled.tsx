import { css } from "emotion";

/**
 * @type {string}
 */
export const webinyInputStyles = css`
    //  fix label position when autofilled
    .mdc-text-field__input:-webkit-autofill + .mdc-floating-label {
        transform: translateY(-106%) scale(0.75);
    }
    &.webiny-ui-input--small {
        &.mdc-text-field {
            height: 35px;
            font-size: 0.85em;
        }
    }
`;
