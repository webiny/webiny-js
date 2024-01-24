import React from "react";
import { Validator } from "@webiny/validation/types";

export interface BindComponentRenderPropValidation {
    isValid: boolean;
    message: string;
    results?: {
        [key: string]: any;
    };
}

export interface BindComponentRenderPropOnChange<T = any> {
    (value: T): Promise<void> | void;
}

export interface FormSubmitOptions {
    skipValidators?: string[];
}
export interface FormAPI<T extends GenericFormData = GenericFormData> {
    data: T;
    submit: (event?: React.SyntheticEvent<any, any>, options?: FormSubmitOptions) => Promise<void>;
    setValue: FormSetValue;
    validate: () => Promise<boolean>;
    validateInput: (name: string) => Promise<boolean | any>;
    options: FormSubmitOptions;
}

export interface UseBindHook<T = any> extends BindComponentRenderProp<T> {
    disabled: boolean;
}

export interface BindComponentRenderProp<T = any, F = Record<string, any>> {
    form: FormAPI<F>;
    onChange: BindComponentRenderPropOnChange;
    value: T;
    validate: () => Promise<boolean | any>;
    validation: BindComponentRenderPropValidation;
}

export interface BindComponentProps<T = any> {
    name: string;
    // Form field value can be anything, so we just let it be `any`.
    beforeChange?: (value: any, cb: (value: any) => void) => void;
    afterChange?: (value: any, form: FormAPI) => void;
    defaultValue?: any;
    validators?: Validator | Validator[];
    children?: ((props: BindComponentRenderProp<T>) => React.ReactElement) | React.ReactElement;
    validate?: Validator;
}

export type BindComponent = React.ComponentType<BindComponentProps>;

export interface FormRenderPropParamsSubmit {
    (event?: React.SyntheticEvent<any, any>): Promise<void>;
}

export interface FormSetValue<T = any> {
    (name: string, value: T): void;
}

export interface FormRenderPropParams<T extends GenericFormData = GenericFormData> {
    form: FormAPI<T>;
    Bind: BindComponent;
    data: T;
    submit: FormRenderPropParamsSubmit;
    setValue: FormSetValue;
    options: FormSubmitOptions;
}

export type GenericFormData = {
    [key: string]: any;
};

export interface Validation {
    isValid?: boolean;
    message?: string;
    [key: string]: any;
}

export interface FormOnSubmit<T = GenericFormData> {
    (data: T, form: FormAPI<T>): void;
}

export interface FormPropsState<T extends GenericFormData = GenericFormData> {
    data: T;
}
export interface FormProps<T extends GenericFormData = GenericFormData> {
    invalidFields?: { [key: string]: any };
    data?: Partial<T>;
    disabled?: boolean | ((state: FormPropsState<T>) => boolean);
    validateOnFirstSubmit?: boolean;
    submitOnEnter?: boolean;
    onSubmit?: FormOnSubmit<T>;
    onInvalid?: () => void;
    onChange?: FormOnSubmit<T>;
    children(params: FormRenderPropParams<T>): React.ReactElement;
    ref?: React.MutableRefObject<any>;
}

/**
 * Use when creating standalone form components which receives props from the parent Bind component.
 */
export interface FormComponentProps {
    validation?: {
        /* Is form element's value valid? */
        isValid: boolean;
        /* Error message if value is not valid. */
        message: string;
        /* Any validation result returned by the validator. */
        results?: { [key: string]: any };
    };

    /* Provided by <Form> component to perform validation when value has changed. */
    validate?: () => Promise<boolean | any>;

    /* Form component's value. */
    value?: any;

    /* A callback that is executed each time a value is changed. */
    onChange?: (value: any) => void;
}
