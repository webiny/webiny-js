import * as React from "react";
import { get } from "lodash";
import { Form } from "./Form";
import invariant from "invariant";

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
    children: ((props: BindComponentRenderProp) => React.ReactElement) | React.ReactElement;
    validate?: Function;
};

export type BindComponent = (props: BindComponentProps) => React.ReactElement;

const createBind = (form: Form) => {
    const Bind: BindComponent = props => {
        const { name, validators = [], children, defaultValue, beforeChange, afterChange } = props;

        invariant(name, `Bind component must have a "name" prop.`);

        // Track component rendering
        form.lastRender.push(name);

        // Store validators and custom messages
        form.inputs[name] = {
            defaultValue,
            validators
        };

        // Build new input props
        const newProps = {
            disabled: false,
            form,
            validate: form.getValidateFn(name),
            validation: form.state.validation[name] || {
                isValid: null,
                message: null,
                results: null
            },
            value: get(form.state, `data.${name}`, defaultValue),
            onChange: form.getOnChangeFn({ name, beforeChange, afterChange })
        };

        // If Form has a `disabled` prop we must evaluate it to see if form input needs to be disabled
        if (form.props.disabled) {
            const inputDisabledByForm =
                typeof form.props.disabled === "function"
                    ? form.props.disabled({ data: { ...form.state.data } })
                    : form.props.disabled;
            // Only override the input prop if the entire Form is disabled
            if (inputDisabledByForm) {
                newProps.disabled = true;
            }
        }

        form.inputs[name].props = newProps;

        if (React.isValidElement(children)) {
            return React.cloneElement(children, newProps);
        }

        return children(newProps);
    };

    return Bind;
};

export { createBind };
