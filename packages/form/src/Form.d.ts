import * as React from "react";
import { BindComponent } from "./Bind";
export declare type FormChildrenRender = {
    data: {
        [key: string]: any;
    };
    form: Form;
    submit: (event?: React.SyntheticEvent<any, any>) => Promise<void>;
    Bind: BindComponent;
    setValue: Function;
};
export declare type Data = {
    [key: string]: any;
};
export declare type Validation = {
    [key: string]: any;
};
export declare type FormProps = {
    invalidFields?: {
        [key: string]: any;
    };
    data?: Data;
    disabled?: boolean | Function;
    validateOnFirstSubmit?: boolean;
    submitOnEnter?: boolean;
    onSubmit?: (data: {
        [key: string]: any;
    }, form: Form) => void;
    onInvalid?: () => void;
    onChange?: (data: Data, form: Form) => void;
    children: (params: FormChildrenRender) => React.ReactElement;
};
declare type State = {
    data: Data;
    originalData: Data;
    wasSubmitted: boolean;
    validation: Validation;
};
export declare class Form extends React.Component<FormProps, State> {
    static defaultProps: {
        data: {};
        disabled: boolean;
        validateOnFirstSubmit: boolean;
        onSubmit: any;
    };
    state: {
        data: Data;
        originalData: Data;
        wasSubmitted: boolean;
        validation: {};
    };
    isValid: any;
    inputs: {};
    lastRender: any[];
    validateFns: {};
    onChangeFns: {};
    Bind: BindComponent;
    static getDerivedStateFromProps({ data, invalidFields }: FormProps, state: State): {
        data: Data;
        originalData: Data;
        validation: {};
    } | {
        validation: Validation;
        data?: undefined;
        originalData?: undefined;
    };
    static executeValidators: (value: any, validators: Function | Function[], formData?: Object) => Promise<any>;
    componentDidUpdate(): void;
    onInvalid: () => void;
    /**
     * MAIN FORM ACTION METHODS
     */
    submit: (event?: React.SyntheticEvent<any, any>) => Promise<void>;
    validate: () => Promise<boolean>;
    validateInput: (name: string) => Promise<any>;
    getOnChangeFn: ({ name, beforeChange, afterChange }: {
        name: string;
        beforeChange: any;
        afterChange: any;
    }) => any;
    getValidateFn: (name: string) => any;
    __setValue: (name: string, value: any) => void;
    __onKeyDown: (e: React.KeyboardEvent<any>) => void;
    render(): React.DOMElement<{
        onKeyDown: (e: React.KeyboardEvent<any>) => void;
    }, Element>;
}
export {};
