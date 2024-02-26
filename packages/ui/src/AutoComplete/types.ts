import React from "react";
import { FormComponentProps } from "~/types";

export interface AutoCompleteBaseProps extends FormComponentProps {
    /**
     * Component label.
     */
    label?: string;

    /**
     * Is component disabled?
     */
    disabled?: boolean;

    /**
     * Is component read-only?
     */
    readOnly?: boolean;

    /**
     * Options that will be shown.
     */
    options: Array<any>;

    /**
     * Description beneath the autoComplete.
     */
    description?: React.ReactNode;

    /**
     * Placeholder text for the form control. Set to a blank string to create a non-floating placeholder label.
     */
    placeholder?: string;

    /**
     * A className for the root element.
     */
    className?: string;

    /**
     * Default structure of value, an object consisting of "id" and "name" keys. Different keys can be set using "valueProp" and "textProp" props.
     */
    value?: { id: string; name: string };

    /**
     * Key in a single option object that will be used as option's value (by default, "id" key will be used).
     */
    valueProp: string;

    /**
     * Key in a single option object that will be used as option's text (by default, "name" key will be used).
     */
    textProp: string;

    /**
     * Callback that gets executed on change of input value.
     */
    onInput?: (value: any) => void;

    /**
     * Callback that gets executed when the input is focused.
     */
    onFocus?: (ev: React.FocusEvent<any>) => void;

    /**
     * Set if you are saving plain strings as values.
     */
    useSimpleValues?: boolean;

    /**
     * Renders a single suggestion item.
     */
    renderItem: (item: any, index?: number) => React.ReactNode;
}
