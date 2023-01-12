import React, { useCallback } from "react";
import { TextField, TextFieldProps } from "@rmwc/textfield";
import { FormElementMessage } from "~/FormElementMessage";
import pick from "lodash/pick";
import { FormComponentProps } from "~/types";
import { ReactElement } from "react";
import { css } from "emotion";
import classNames from "classnames";

export type InputProps<TValue = any> = FormComponentProps<TValue> &
    TextFieldProps & {
        // Should this input be filled with browser values
        autoComplete?: string;

        // If true, will pass native `event` to the `onChange` callback
        rawOnChange?: boolean;

        // Auto-focus input
        autoFocus?: boolean;

        // Input placeholder
        placeholder?: string;

        // Description beneath the input.
        description?: string | ReactElement;

        // Converts input into a text area with given number of rows.
        rows?: number;

        maxLength?: number;

        // A callback that is executed when input focus is lost.
        onBlur?: (e: React.SyntheticEvent<HTMLInputElement>) => any;

        onKeyDown?: (e: React.SyntheticEvent<HTMLInputElement>) => any;

        // A callback that gets triggered when the user presses the "Enter" key.
        onEnter?: () => any;

        // CSS class name
        className?: string;

        // For testing purposes.
        "data-testid"?: string;
    };

/**
 * fix label position when autofilled
 * @type {string}
 */
const webinyInputStyles = css`
    .mdc-text-field__input:-webkit-autofill + .mdc-floating-label {
        transform: translateY(-106%) scale(0.75);
    }
`;

/**
 * Use Input component to store short string values, like first name, last name, e-mail etc.
 * Additionally, with rows prop, it can also be turned into a text area, to store longer strings.
 */

// IconProps directly passed to RMWC
const rmwcProps = [
    "label",
    "type",
    "step",
    "disabled",
    "readOnly",
    "placeholder",
    "outlined",
    "onKeyDown",
    "onKeyPress",
    "onKeyUp",
    "onFocus",
    "rootProps",
    "fullwidth",
    "inputRef",
    "className",
    "maxLength",
    "characterCount"
];

export const Input: React.FC<InputProps> = props => {
    const onChange = useCallback(
        (e: React.SyntheticEvent<HTMLInputElement>) => {
            const { onChange, rawOnChange } = props;
            if (!onChange) {
                return;
            }

            // @ts-ignore
            onChange(rawOnChange ? e : e.target.value);
        },
        [props.onChange, props.rawOnChange]
    );

    const onBlur = useCallback(
        async (e: React.SyntheticEvent<HTMLInputElement>) => {
            const { validate, onBlur } = props;
            if (validate) {
                // Since we are accessing event in an async operation, we need to persist it.
                // See https://reactjs.org/docs/events.html#event-pooling.
                e.persist();
                await validate();
            }
            onBlur && onBlur(e);
        },
        [props.validate, props.onBlur]
    );

    const {
        autoFocus,
        value,
        label,
        description,
        placeholder,
        rows,
        validation,
        icon,
        trailingIcon,
        onEnter,
        ...rest
    } = props;

    let inputValue = value;
    if (value === null || typeof value === "undefined") {
        inputValue = "";
    }

    const { isValid: validationIsValid, message: validationMessage } = validation || {};

    const inputOnKeyDown = useCallback(e => {
        if (typeof onEnter === "function" && e.key === "Enter") {
            onEnter();
        }

        if (typeof rest.onKeyDown === "function") {
            return rest.onKeyDown(e);
        }
    }, []);

    return (
        <React.Fragment>
            <TextField
                {...pick(rest, rmwcProps)}
                onKeyDown={inputOnKeyDown}
                autoFocus={autoFocus}
                textarea={Boolean(rows)}
                value={inputValue}
                onChange={onChange}
                onBlur={onBlur}
                label={label}
                icon={icon}
                placeholder={(!label && placeholder) || undefined}
                trailingIcon={trailingIcon}
                rows={rows}
                className={classNames("webiny-ui-input", webinyInputStyles)}
                data-testid={props["data-testid"]}
            />

            {validationIsValid === false && (
                <FormElementMessage error>{validationMessage}</FormElementMessage>
            )}
            {validationIsValid !== false && description && (
                <FormElementMessage>{description}</FormElementMessage>
            )}
        </React.Fragment>
    );
};

Input.defaultProps = { rawOnChange: false };
