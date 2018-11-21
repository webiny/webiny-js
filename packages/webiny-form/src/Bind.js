// @flow
import * as React from "react";
import { get, isFunction } from "lodash";
import type Form from "./Form";
import validation from "./validation";

export type Props = {
    name: string,
    beforeChange?: Function,
    afterChange?: Function,
    defaultValue?: any,
    validators: Array<string>,
    validationMessages?: { [string]: string },
    children: any,
    validate: Function
};

const createBind = (form: Form) => {
    const Bind = (props: Props) => {
        const {
            name,
            validators = [],
            validationMessages = {},
            children,
            defaultValue,
            beforeChange,
            afterChange
        } = props;

        // Track component rendering
        form.lastRender.push(name);

        // Store validators and custom messages
        form.inputs[name] = {
            defaultValue,
            validators: validation.parseValidators(validators),
            validationMessages
        };

        // Build new input props
        const newProps = {
            form,
            disabled: false,
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
            const inputDisabledByForm = isFunction(form.props.disabled)
                ? form.props.disabled({ data: { ...form.state.data } })
                : form.props.disabled;
            // Only override the input prop if the entire Form is disabled
            if (inputDisabledByForm) {
                newProps["disabled"] = true;
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
