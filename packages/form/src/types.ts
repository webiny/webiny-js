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
    (value: T): Promise<void>;
}

export interface FormAPI<T = Record<string, any>> {
    data: T;
    submit: (event?: React.SyntheticEvent<any, any>) => Promise<void>;
    setValue: FormSetValue;
    validate: () => Promise<boolean>;
    validateInput: (name: string) => Promise<boolean | any>;
}

export interface BindComponentRenderProp<T = any, F = Record<string, any>> {
    form: FormAPI<F>;
    onChange: BindComponentRenderPropOnChange;
    value: T;
    validate: () => Promise<boolean | any>;
    validation: BindComponentRenderPropValidation;
}

export interface BindComponentProps {
    name: string;
    // Form field value can be anything, so we just let it be `any`.
    beforeChange?: (value: any, cb: (value: any) => void) => void;
    afterChange?: (value: any, form: FormAPI) => void;
    defaultValue?: any;
    validators?: Validator | Validator[];
    children?: ((props: BindComponentRenderProp) => React.ReactElement) | React.ReactElement;
    validate?: Function;
}

export type BindComponent = React.FC<BindComponentProps>;

export interface FormRenderPropParamsSubmit {
    (event?: React.SyntheticEvent<any, any>): Promise<void>;
}

export interface FormSetValue<T = any> {
    (name: string, value: T): void;
}

/**
 * TODO @ts-refactor
 * Remove any so it is required to send the generic value.
 */
export interface FormRenderPropParams<T = any> {
    form: FormAPI;
    Bind: BindComponent;
    data: T;
    submit: FormRenderPropParamsSubmit;
    setValue: FormSetValue;
}

export interface FormData {
    [key: string]: any;
}

export interface Validation {
    isValid?: boolean;
    message?: string;
    [key: string]: any;
}

export interface FormOnSubmit<T = FormData> {
    (data: T, form?: FormAPI): void;
}

export interface FormProps<T extends Record<string, any> = Record<string, any>> {
    invalidFields?: { [key: string]: any };
    data?: FormData & T;
    disabled?: boolean | Function;
    validateOnFirstSubmit?: boolean;
    submitOnEnter?: boolean;
    onSubmit?: FormOnSubmit;
    onInvalid?: () => void;
    onChange?: FormOnSubmit;
    children(params: FormRenderPropParams): React.ReactElement;
    ref: React.MutableRefObject<any>;
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
