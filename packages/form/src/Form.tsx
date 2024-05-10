import React, { useEffect, useImperativeHandle, useMemo } from "react";
import { observer } from "mobx-react-lite";
import lodashNoop from "lodash/noop";
import { Bind } from "./Bind";
import { FormProps, GenericFormData } from "~/types";
import { FormContext } from "./FormContext";
import { FormPresenter } from "./FormPresenter";
import { FormAPI } from "./FormApi";

function FormInner<T extends GenericFormData = GenericFormData>(
    props: FormProps<T>,
    ref: React.ForwardedRef<any>
) {
    const presenter = useMemo(() => new FormPresenter<T>(), []);
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
        presenter.init({
            data: (props.data || {}) as T,
            onChange: data => {
                if (typeof props.onChange === "function") {
                    props.onChange(data, formApi);
                }
            },
            onInvalid: props.onInvalid
        });
    }, []);

    useEffect(() => {
        presenter.setInvalidFields(props.invalidFields || {});
    }, [props.invalidFields]);

    useEffect(() => {
        presenter.setData(props.data as T);
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
            // @ts-expect-error
            e.target && e.target.blur();
            e.preventDefault();
            e.stopPropagation();
            // Fire submit with a small delay to allow input validation to complete.
            // Not an ideal solution but works fine at this point. Will revisit this later.
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
                    submit: (...args) => formApi.submit(...args),
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
