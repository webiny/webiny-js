import React from "react";
import { Form } from "./Form";

export interface BindComponentRenderPropValidation {
    isValid: boolean;
    message: string;
    results?: {
        [key: string]: any;
    };
}

export type BindComponentRenderPropOnChange<T = any> = (value: T) => Promise<void>;

export interface FormAPI<T extends Record<string, any> = Record<string, any>> {
    data: T;
    submit: (event?: React.SyntheticEvent<any, any>) => Promise<void>;
    setValue: FormSetValue;
    validate: () => void;
    validateInput: (name: string) => Promise<boolean | any>;
}

export interface BindComponentRenderProp<T = any> {
    form: FormAPI;
    onChange: BindComponentRenderPropOnChange;
    value: T;
    validate: () => Promise<boolean | any>;
    validation: BindComponentRenderPropValidation;
}

export interface BindComponentProps {
    name: string;
    beforeChange?: (value: string | string[], cb: (value: string | string[]) => void) => void;
    afterChange?: (value: string | string[], form: Form) => void;
    defaultValue?: any;
    validators?: Function | Array<Function>;
    children?: ((props: BindComponentRenderProp) => React.ReactElement) | React.ReactElement;
    validate?: Function;
}

export type BindComponent = (props: BindComponentProps) => React.ReactElement;

export type FormRenderPropParamsSubmit = (event?: React.SyntheticEvent<any, any>) => Promise<void>;

export type FormSetValue = <T = any>(name: string, value: T) => void;

export interface FormRenderPropParams<T = Record<string, any>> {
    form: FormAPI;
    Bind: BindComponent;
    data: T;
    submit: FormRenderPropParamsSubmit;
    setValue: FormSetValue;
}

export type FormRenderProp = (params: FormRenderPropParams) => React.ReactElement;

export type FormData = { [key: string]: any };

export type Validation = { [key: string]: any };

export type FormOnSubmit<T = FormData> = (data: T, form?: Form) => void;

export interface FormProps<T extends Record<string, any> = Record<string, any>> {
    invalidFields?: { [key: string]: any };
    data?: FormData & T;
    disabled?: boolean | Function;
    validateOnFirstSubmit?: boolean;
    submitOnEnter?: boolean;
    onSubmit?: FormOnSubmit;
    onInvalid?: () => void;
    onChange?: FormOnSubmit;
    children: FormRenderProp;
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
