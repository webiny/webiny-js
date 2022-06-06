import React from "react";
import { TextField, TextFieldProps } from "@rmwc/textfield";
import { FormElementMessage } from "~/FormElementMessage";
import pick from "lodash/pick";
import { FormComponentProps } from "~/types";
import { ReactElement } from "react";
import { css } from "emotion";
import classNames from "classnames";

export type InputProps = FormComponentProps &
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
    };

/**
 * fix label position when autofilled
 * @type {string}
 */
const webinyInputStyles = css(
    {},
    {
        ".mdc-text-field__input:-webkit-autofill + .mdc-floating-label": {
            transform: "translateY(-106%) scale(0.75)"
        }
    }
);

/**
 * Use Input component to store short string values, like first name, last name, e-mail etc.
 * Additionally, with rows prop, it can also be turned into a text area, to store longer strings.
 */

export class Input extends React.Component<InputProps> {
    static defaultProps: InputProps = {
        rawOnChange: false
    };

    // IconProps directly passed to RMWC
    static rmwcProps = [
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

    onChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const { onChange, rawOnChange } = this.props;
        if (!onChange) {
            return;
        }

        // @ts-ignore
        onChange(rawOnChange ? e : e.target.value);
    };

    onBlur = async (e: React.SyntheticEvent<HTMLInputElement>) => {
        const { validate, onBlur } = this.props;
        if (validate) {
            // Since we are accessing event in an async operation, we need to persist it.
            // See https://reactjs.org/docs/events.html#event-pooling.
            e.persist();
            await validate();
        }
        onBlur && onBlur(e);
    };

    public override render() {
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
            ...props
        } = this.props;

        let inputValue = value;
        if (value === null || typeof value === "undefined") {
            inputValue = "";
        }

        const { isValid: validationIsValid, message: validationMessage } = validation || {};

        return (
            <React.Fragment>
                <TextField
                    {...pick(props, Input.rmwcProps)}
                    onKeyDown={(e, ...rest) => {
                        if (typeof onEnter === "function" && e.key === "Enter") {
                            onEnter();
                        }

                        if (typeof props.onKeyDown === "function") {
                            return props.onKeyDown(e, ...rest);
                        }
                    }}
                    autoFocus={autoFocus}
                    textarea={Boolean(rows)}
                    value={inputValue}
                    onChange={this.onChange}
                    onBlur={this.onBlur}
                    label={label}
                    icon={icon}
                    placeholder={(!label && placeholder) || undefined}
                    trailingIcon={trailingIcon}
                    rows={this.props.rows}
                    className={classNames("webiny-ui-input", webinyInputStyles)}
                />

                {validationIsValid === false && (
                    <FormElementMessage error>{validationMessage}</FormElementMessage>
                )}
                {validationIsValid !== false && description && (
                    <FormElementMessage>{description}</FormElementMessage>
                )}
            </React.Fragment>
        );
    }
}
