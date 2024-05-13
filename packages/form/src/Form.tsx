import React, { useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { observer } from "mobx-react-lite";
import isEqual from "lodash/isEqual";
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
    const refData = useRef<Partial<T> | undefined>(props.data);

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
        // Check if the current props.data is equal to the data stored in refData.current
        if (isEqual(refData.current, props.data)) {
            // If they are equal, return early without performing any further action
            return;
        }

        // Update the presenter's data with the new props.data
        presenter.setData(props.data as T);

        // Update refData.current to store the latest props.data
        refData.current = props.data;

        // Clean-up function: reset presenter's data when the component unmounts
        return () => {
            presenter.setData({} as T);
        };
    }, [props.data, refData.current]);

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
