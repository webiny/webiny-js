import * as React from "react";
import { Form } from "./Form";
export declare type BindComponentRenderProp = {
    form: Object;
    onChange: (value: any) => Promise<void>;
    value: any;
    validate: () => Promise<void>;
    validation: {
        isValid: boolean;
        message: string;
        results?: {
            [key: string]: any;
        };
    };
};
export declare type BindComponentProps = {
    name: string;
    beforeChange?: Function;
    afterChange?: Function;
    defaultValue?: any;
    validators?: Function | Array<Function>;
    children: ((props: BindComponentRenderProp) => React.ReactElement) | React.ReactElement;
    validate?: Function;
};
export declare type BindComponent = (props: BindComponentProps) => React.ReactElement;
declare const createBind: (form: Form) => BindComponent;
export { createBind };
