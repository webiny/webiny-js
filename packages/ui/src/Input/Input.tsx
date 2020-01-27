import * as React from "react";
import { TextField, TextFieldProps } from "@rmwc/textfield";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import pick from "lodash/pick";
import { FormComponentProps } from "./../types";
import { ReactElement } from "react";

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

        // A trailing icon. Use `<InputIcon/>` component.
        leadingIcon?: React.ReactNode;

        // A callback that is executed when input focus is lost.
        onBlur?: (e: React.SyntheticEvent<HTMLInputElement>) => any;

        onKeyDown?: (e: React.SyntheticEvent<HTMLInputElement>) => any;

        // CSS class name
        className?: string;
    };

/**
 * Use Input component to store short string values, like first name, last name, e-mail etc.
 * Additionally, with rows prop, it can also be turned into a text area, to store longer strings.
 */

export class Input extends React.Component<InputProps> {
    static defaultProps = {
        rawOnChange: false,
        validation: { isValid: null, message: null }
    };

    // IconProps directly passed to RMWC
    static rmwcProps = [
        "label",
        "type",
        "disabled",
        "placeholder",
        "outlined",
        "onKeyDown",
        "onKeyPress",
        "onKeyUp",
        "onFocus",
        "rootProps",
        "fullwidth",
        "inputRef",
        "className"
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

    render() {
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
            ...props
        } = this.props;

        let inputValue = value;
        if (value === null || typeof value === "undefined") {
            inputValue = "";
        }

        return (
            <React.Fragment>
                <TextField
                    {...pick(props, Input.rmwcProps)}
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
                />

                {validation.isValid === false && (
                    <FormElementMessage error>{validation.message}</FormElementMessage>
                )}
                {validation.isValid !== false && description && (
                    <FormElementMessage>{description}</FormElementMessage>
                )}
            </React.Fragment>
        );
    }
}
