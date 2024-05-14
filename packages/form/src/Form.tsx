import React, { useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { observer } from "mobx-react-lite";
import lodashNoop from "lodash/noop";
import isEqual from "lodash/isEqual";

import { Bind } from "./Bind";
import { FormProps, GenericFormData } from "~/types";
import { FormContext } from "./FormContext";
import { FormPresenter } from "./FormPresenter";
import { FormAPI } from "./FormApi";

function FormInner<T extends GenericFormData = GenericFormData>(
    props: FormProps<T>,
    ref: React.ForwardedRef<any>
) {
    const dataRef = useRef(props.data);

    const presenter = useMemo(() => {
        const presenter = new FormPresenter<T>();
        presenter.init({
            data: (props.data || {}) as T,
            onChange: data => {
                if (typeof props.onChange === "function") {
                    props.onChange(data, formApi);
                }
            },
            onInvalid: props.onInvalid
        });
        return presenter;
    }, []);

    const formApi = useMemo(() => {
        return new FormAPI(presenter, {
            onSubmit: props.onSubmit ?? lodashNoop,
            isFormDisabled: props.disabled ?? false,
            validateOnFirstSubmit: props.validateOnFirstSubmit ?? true
        });
    }, [presenter]);

    useEffect(() => {
        formApi.setOptions({
            onSubmit: props.onSubmit ?? lodashNoop,
            isFormDisabled: props.disabled ?? false,
            validateOnFirstSubmit: props.validateOnFirstSubmit ?? true
        });
    }, [props.onSubmit, props.disabled, props.validateOnFirstSubmit]);

    useEffect(() => {
        presenter.setInvalidFields(props.invalidFields || {});
    }, [props.invalidFields]);

    useEffect(() => {
        // We only set form's data if props.data has changed.
        if (isEqual(dataRef.current, props.data)) {
            return;
        }

        // Set the new form data.
        presenter.setData(props.data as T);

        // Keep the new props.data for future comparison.
        dataRef.current = props.data;
    }, [props.data]);

    useImperativeHandle(ref, () => ({
        validate: () => formApi.validate(),
        submit: formApi.submit
    }));

    const vm = presenter.vm;

    const __onKeyDown = (e: React.KeyboardEvent<any>) => {
        const { submitOnEnter = false } = props;
        if (
            (submitOnEnter || e.metaKey || e.ctrlKey) &&
            e.key === "Enter" &&
            !e.isDefaultPrevented()
        ) {
            // Need to blur current target in case of input fields to trigger validation
            e.preventDefault();
            e.stopPropagation();
            formApi.submit();
        }
    };

    const children = props.children;
    if (typeof children !== "function") {
        throw new Error("Form must have a function as its only child!");
    }

    const formContext = useMemo(() => {
        return {
            ...formApi,
            data: vm.data
        };
    }, [vm.data, vm.invalidFields]);

    return (
        <FormContext.Provider value={formContext}>
            {React.createElement(
                "webiny-form-container",
                { onKeyDown: __onKeyDown },
                children({
                    data: formApi.data,
                    setValue: formApi.setValue,
                    form: formApi,
                    submit: formApi.submit,
                    Bind
                })
            )}
        </FormContext.Provider>
    );
}

export const Form = observer(
    React.forwardRef(FormInner) as <T extends GenericFormData = GenericFormData>(
        props: FormProps<T> & { ref?: React.ForwardedRef<any> }
    ) => ReturnType<typeof FormInner<T>>
);
