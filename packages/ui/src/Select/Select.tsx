import React, { useMemo } from "react";
import { FormComponentProps } from "~/types";
import { Select as AdminSelect } from "@webiny/admin-ui";
import { SelectOptionDto } from "@webiny/admin-ui";

export interface FormattedOption extends Omit<React.AllHTMLAttributes<any>, "label"> {
    label: React.ReactNode;
    value?: string;
    options?: FormattedOption[];
}

export interface RmwcSelectProps {
    /** The value for a controlled select. */
    value?: string;
    /** Adds help text to the field */
    helpText?: React.ReactNode;
    /** Options accepts flat arrays, value => label maps, and more. See examples for details. */
    options?:
        | FormattedOption[]
        | string[]
        | {
              [value: string]: string;
          };
    /** A label for the form control. */
    label?: string;
    /** Placeholder text for the form control. Set to a blank string to create a non-floating placeholder label. */
    placeholder?: string;
    /** Makes the select outlined. */
    outlined?: boolean;
    /** Makes the Select visually invalid. This is sometimes automatically my material-components-web.  */
    invalid?: boolean;
    /** Makes the Select disabled.  */
    disabled?: boolean;
    /** Makes the Select required.  */
    required?: boolean;
    /** Props for the root element. By default, additional props spread to the native select element.  */
    // rootProps?: Object;
    /** A reference to the native select element. Not applicable when `enhanced` is true. */
    inputRef?: (ref: HTMLSelectElement | null) => void;
    /** Add a leading icon. */
    icon?: React.ReactNode;
    /** Advanced: A reference to the MDCFoundation. */
    foundationRef?: any;
}

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
        children?: (React.ReactElement<"option"> | React.ReactElement<"optgroup">)[];

        // IconProps for the root element. By default, additional props spread to the native select element.
        rootProps?: {
            [key: string]: any;
        };

        // A className for the root element.
        className?: string;

        // Size - small, medium or large
        size?: "small" | "medium" | "large";
    };

/**
 * TODO verify that this is correct method get all options.
 */
const getOptions = (initialOptions: SelectProps["options"]): SelectOptionDto[] => {
    if (!initialOptions) {
        return [];
    } else if (Array.isArray(initialOptions)) {
        const options: SelectOptionDto[] = [];
        for (const option of initialOptions) {
            if (typeof option === "string") {
                options.push({
                    label: option,
                    value: option
                });
                continue;
            }
            options.push({
                label: String(option.label),
                value: option.value,
                options: getOptions(option.options)
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
 * Select component lets users to manually build the option list.
 */
function getChildrenOptions(children: React.ReactNode): SelectOptionDto[] {
    return React.Children.toArray(children)
        .filter(
            child =>
                React.isValidElement(child) &&
                (child.type === "option" || child.type === "optgroup")
        )
        .map(child => {
            const element = child as React.ReactElement<{
                value?: string;
                label?: string;
                children?: React.ReactNode;
            }>;

            if (React.isValidElement(child) && child.type === "option") {
                return {
                    value: element.props.value || "",
                    label: element.props.children?.toString() || ""
                };
            }

            if (React.isValidElement(child) && child.type === "optgroup") {
                return {
                    label: element.props.label || "",
                    options: getChildrenOptions(element.props.children)
                };
            }

            return null; // This shouldn't be reached
        })
        .filter(Boolean) as SelectOptionDto[];
}

/**
 * Select component lets users choose a value from given set of options.
 */
const skipProps = ["validate", "form"];

const getRmwcProps = (props: SelectProps): FormComponentProps & RmwcSelectProps => {
    const newProps: FormComponentProps & RmwcSelectProps = {};
    Object.keys(props)
        .filter(name => !skipProps.includes(name))
        // @ts-expect-error
        .forEach((name: any) => (newProps[name] = props[name]));

    return newProps;
};

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Select` component from the `@webiny/admin-ui` package instead.
 */
export const Select = (props: SelectProps) => {
    const { value: initialValue, ...other } = props;
    const value = initialValue === null || initialValue === undefined ? "" : initialValue;

    const options = getOptions(other.options);
    const childrenOptions = getChildrenOptions(props.children);

    // Memoize the label and placeholder values based on the component size.
    const { label, placeholder } = useMemo(() => {
        const { size, label, placeholder: placeholderText } = props;

        // If `placeholderText` is null, undefined, or an empty string after trimming, `placeholder` will be set to `undefined`.
        const placeholder = placeholderText?.trim() || undefined;

        // For small or medium size, we set only the placeholder, using label as fallback.
        if (size === "small" || size === "medium") {
            return {
                label: undefined,
                placeholder: placeholder || label
            };
        }

        // For other sizes, use the provided label and placeholder.
        return {
            label,
            placeholder
        };
    }, [props.label, props.placeholder, props.size]);

    const size = useMemo(() => {
        if (props.size === "medium") {
            return "md";
        }

        if (props.size === "large") {
            return "lg";
        }

        return "lg";
    }, [props.size]);

    return (
        <AdminSelect
            {...getRmwcProps(other)}
            options={[...options, ...childrenOptions]}
            value={value}
            label={label}
            placeholder={placeholder}
            size={size}
            onChange={value => props?.onChange?.(value)}
            displayResetAction={false}
        />
    );
};

export default Select;
