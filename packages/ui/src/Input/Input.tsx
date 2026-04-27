import type { ReactElement } from "react";
import React, { useCallback, useMemo } from "react";
import pick from "lodash/pick.js";
import type { FormComponentProps } from "~/types.js";
import { Input as AdminInput, Textarea as AdminTextarea } from "@webiny/admin-ui";

export interface TextFieldHelperTextProps {
    /** Make the help text always visible */
    persistent?: boolean;
    /** Make the help a validation message style */
    validationMsg?: boolean;
    /** Content for the help text */
    children: React.ReactNode;
}

export interface TextFieldProps {
    /** Sets the value for controlled TextFields. */
    value?: string | number;
    /** Adds help text to the field */
    helpText?: React.ReactNode | TextFieldHelperTextProps;
    /** Shows the character count, must be used in conjunction with maxLength. */
    characterCount?: boolean;
    /** Makes the TextField visually invalid. This is sometimes automatically applied in cases where required or pattern is used.  */
    invalid?: boolean;
    /** Makes the Textfield disabled. */
    disabled?: boolean;
    /** Makes the Textfield required. */
    required?: boolean;
    /** Outline the TextField. */
    outlined?: boolean;
    /** How to align the text inside the TextField. Defaults to 'start'. */
    align?: "start" | "end";
    /** A label for the input. */
    label?: React.ReactNode;
    /** The label floats automatically based on value, but you can use this prop for manual control. */
    floatLabel?: boolean;
    /** Makes a multiline TextField. */
    textarea?: boolean;
    /** Makes the TextField fullwidth. */
    fullwidth?: boolean;
    /** Add a leading icon. */
    icon?: any;
    /** Add a trailing icon. */
    trailingIcon?: any;
    /** By default, props spread to the input. These props are for the component's root container. */
    rootProps?: any;
    /** A reference to the native input or textarea. */
    inputRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement | null>;
    /** The type of input field to render, search, number, etc */
    type?: string;
    /** Add prefix. */
    prefix?: string;
    /** Add suffix. */
    suffix?: string;
    /** Advanced: A reference to the MDCFoundation. */
    foundationRef?: any;
    /** Make textarea resizeable */
    resizeable?: boolean;
}

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
        onBlur?: (e: React.SyntheticEvent<any>) => any;

        onKeyDown?: (e: React.SyntheticEvent<any>) => any;

        // A callback that gets triggered when the user presses the "Enter" key.
        onEnter?: () => any;

        // CSS class name
        className?: string;

        // For testing purposes.
        "data-testid"?: string;

        // Size - small, medium or large
        size?: "small" | "medium" | "large";

        children?: React.ReactNode;
    };

/**
 * Use Input component to store short string values, like first name, last name, e-mail etc.
 * Additionally, with rows prop, it can also be turned into a text area, to store longer strings.
 */

// IconProps directly passed to RMWC
const rmwcProps = [
    "label",
    "type",
    "disabled",
    "readOnly",
    "placeholder",
    "onKeyDown",
    "onEnter",
    "onKeyPress",
    "onKeyUp",
    "onFocus",
    "className",
    "maxLength",
    "characterCount",
    "autoComplete",
    "maxLength"
];

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Input` component from the `@webiny/admin-ui` package instead.
 */
export const Input = (props: InputProps) => {
    const {
        autoFocus,
        value,
        description,
        placeholder,
        rows,
        validation,
        icon,
        trailingIcon,
        onBlur,
        onChange,
        rawOnChange,
        required,
        inputRef,
        ...rest
    } = props;

    let inputValue = value;
    if (value === null || typeof value === "undefined") {
        inputValue = "";
    }

    const size = useMemo(() => {
        if (props.size === "medium") {
            return "md";
        }

        if (props.size === "large") {
            return "lg";
        }

        return "lg";
    }, [props.size]);

    const getValidIcon = useCallback((icon: React.ReactNode) => {
        if (React.isValidElement(icon)) {
            return icon;
        }

        return undefined;
    }, []);

    if (rows) {
        return (
            <AdminTextarea
                {...pick(rest, rmwcProps)}
                autoFocus={autoFocus}
                value={inputValue}
                onChange={onChange}
                placeholder={placeholder}
                size={size}
                className={"webiny-ui-input"}
                data-testid={props["data-testid"]}
                validation={validation}
                description={description}
                required={required}
                rows={rows}
                forwardEventOnChange={rawOnChange}
                textareaRef={inputRef as React.Ref<HTMLTextAreaElement> | undefined}
                onBlur={onBlur}
            />
        );
    }

    return (
        <AdminInput
            {...pick(rest, rmwcProps)}
            autoFocus={autoFocus}
            value={inputValue}
            onChange={onChange}
            startIcon={getValidIcon(icon)}
            endIcon={getValidIcon(trailingIcon)}
            placeholder={placeholder}
            size={size}
            className={"webiny-ui-input"}
            data-testid={props["data-testid"]}
            validation={validation}
            description={description}
            required={required}
            forwardEventOnChange={rawOnChange}
            inputRef={inputRef as React.Ref<HTMLInputElement> | undefined}
            onBlur={onBlur}
        />
    );
};
