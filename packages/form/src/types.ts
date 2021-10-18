export type BindComponentRenderPropValidation = {
    isValid: boolean;
    message: string;
    results?: { [key: string]: any };
};

export type BindComponentRenderPropOnChange = (value: any) => Promise<void>;

export type BindComponentRenderProp = {
    form: Object;
    onChange: BindComponentRenderPropOnChange;
    value: any;
    validate: () => Promise<boolean | any>;
    validation: BindComponentRenderPropValidation;
};

export type BindComponentProps = {
    name: string;
    beforeChange?: Function;
    afterChange?: Function;
    defaultValue?: any;
    validators?: Function | Array<Function>;
    children?: ((props: BindComponentRenderProp) => React.ReactElement) | React.ReactElement;
    validate?: Function;
};

export type BindComponent = (props: BindComponentProps) => React.ReactElement;


export type FormRenderPropParamsSubmit = (event?: React.SyntheticEvent<any, any>) => Promise<void>;

export type FormSetValue = (name: string, value: any) => void;

export type FormRenderPropParams = {
    data: { [key: string]: any };
    form: any;
    submit: FormRenderPropParamsSubmit;
    Bind: BindComponent;
    setValue: FormSetValue;
};

export type FormRenderProp = (params: FormRenderPropParams) => React.ReactElement;

export type FormData = { [key: string]: any };

export type Validation = { [key: string]: any };

export type FormOnSubmit = (data: FormData, form?: any) => void;

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
