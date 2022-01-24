import { Form } from "./Form";

export type BindComponentRenderPropValidation = {
    isValid: boolean;
    message: string;
    results?: { [key: string]: any };
};

export type BindComponentRenderPropOnChange = (value: any) => Promise<void>;

export interface FormAPI {
    data: { [key: string]: any };
    submit: (event?: React.SyntheticEvent<any, any>) => Promise<void>;
    setValue: FormSetValue;
    validate: () => void;
    validateInput: (name: string) => Promise<boolean | any>;
}

export type BindComponentRenderProp = {
    form: FormAPI;
    onChange: BindComponentRenderPropOnChange;
    value: any;
    validate: () => Promise<boolean | any>;
    validation: BindComponentRenderPropValidation;
};

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

export type FormSetValue = (name: string, value: any) => void;

export type FormRenderPropParams = {
    form: FormAPI;
    Bind: BindComponent;
    data: { [key: string]: any };
    submit: FormRenderPropParamsSubmit;
    setValue: FormSetValue;
};

export type FormRenderProp = (params: FormRenderPropParams) => React.ReactElement;

export type FormData = { [key: string]: any };

export type Validation = { [key: string]: any };

export type FormOnSubmit = (data: FormData, form?: Form) => void;

export type FormProps = {
    invalidFields?: { [key: string]: any };
    data?: FormData;
    disabled?: boolean | Function;
    validateOnFirstSubmit?: boolean;
    submitOnEnter?: boolean;
    onSubmit?: FormOnSubmit;
    onInvalid?: () => void;
    onChange?: FormOnSubmit;
    children: FormRenderProp;
};

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
