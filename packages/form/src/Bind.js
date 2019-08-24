// @flow
import * as React from "react";
import { get } from "lodash";
import type Form from "./Form";
import validation from "./validation";
import invariant from "invariant";

export type BindComponentPropsType = {
    name: string,
    beforeChange?: Function,
    afterChange?: Function,
    defaultValue?: any,
    validators: Array<string>,
    validationMessages?: { [string]: string },
    children: React.Node | BindComponentRenderPropType,
    validate: Function
};

export type BindComponentRenderPropType = {
    form: Object,
    onChange: (value: any) => Promise<void>,
    value: any,
    validate: () => Promise<void>,
    validation: {
        isValid: boolean,
        message: string,
        results: ?Object
    }
};

export type BindComponentType = BindComponentPropsType => React.Node;

const createBind = (form: Form) => {
    const Bind: BindComponentType = props => {
        const {
            name,
            validators = [],
            validationMessages = {},
            children,
            defaultValue,
            beforeChange,
            afterChange
        } = props;

        invariant(name, `Bind component must have a "name" prop.`);

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
            // $FlowFixMe
            return React.cloneElement(children, newProps);
        }

        // $FlowFixMe
        return children(newProps);
    };

    return Bind;
};

export { createBind };
