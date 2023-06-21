import React from "react";
import {
    FormattedOption,
    Select as RmwcSelect,
    SelectProps as RmwcSelectProps
} from "@rmwc/select";
import { FormElementMessage } from "~/FormElementMessage";
import { FormComponentProps } from "~/types";
import classNames from "classnames";
import { webinySelect, noLabel } from "./styled";

export type SelectProps = FormComponentProps &
    RmwcSelectProps & {
        // Component label.
        label?: string;

        // Is checkbox disabled?
        disabled?: boolean;

        // Description beneath the select.
        description?: string;

        // Placeholder text for the form control. Set to a blank string to create a non-floating placeholder label.
        placeholder?: string;

        // Makes the Select have a visual box.
        box?: string;

        // One or more <option> or <optgroup> elements.
        children?: Array<React.ReactElement<"option"> | React.ReactElement<"optgroup">>;

        // IconProps for the root element. By default, additional props spread to the native select element.
        rootProps?: Object;

        // A className for the root element.
        className?: string;

        // Size - small, medium or large
        size?: "small" | "medium" | "large";
    };

/**
 * TODO verify that this is correct method get all options.
 */
const getOptions = (initialOptions: SelectProps["options"]): FormattedOption[] => {
    if (!initialOptions) {
        return [];
    } else if (Array.isArray(initialOptions)) {
        const options: FormattedOption[] = [];
        for (const option of initialOptions) {
            if (typeof option === "string") {
                options.push({
                    label: option,
                    value: option
                });
                continue;
            }
            options.push({
                label: option.label,
                value: option.value,
                options: option.options
            });
        }
        return options;
    }
    return Object.keys(initialOptions).map(key => {
        return {
            label: initialOptions[key],
            value: key
        };
    });
};

/**
 * Select component lets users choose a value from given set of options.
 */
const skipProps = ["validate", "form"];

const getRmwcProps = (props: SelectProps): FormComponentProps & RmwcSelectProps => {
    const newProps: FormComponentProps & RmwcSelectProps = {};
    Object.keys(props)
        .filter(name => !skipProps.includes(name))
        // @ts-ignore
        .forEach((name: any) => (newProps[name] = props[name]));

    return newProps;
};
/**
 * We check for null and undefined in the value because React is complaining about those values.
 * Error says to use the empty string in null/undefined case.
 */
export const Select: React.FC<SelectProps> = props => {
    const { value: initialValue, description, validation, ...other } = props;

    const value = initialValue === null || initialValue === undefined ? "" : initialValue;

    const { isValid: validationIsValid, message: validationMessage } = validation || {};

    const options = getOptions(other.options);

    return (
        <React.Fragment>
            <RmwcSelect
                {...getRmwcProps(other)}
                options={options}
                value={value}
                className={classNames(
                    "webiny-ui-select mdc-ripple-surface mdc-ripple-upgraded",
                    webinySelect,
                    props.size ? `webiny-ui-select--size-${props.size}` : null,
                    props.className,
                    {
                        [noLabel]: !props.label
                    }
                )}
                onChange={e => {
                    props.onChange && props.onChange((e.target as any).value);
                }}
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

export default Select;
