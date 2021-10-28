import * as React from "react";
import _ from "lodash";
import set from "lodash/fp/set";
import { Bind } from "./BindNew";
import ValidationError from "./ValidationError";
import { useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { BindComponentProps, FormAPI, FormProps, Validation } from "~/types";

type State = {
    data: FormData;
    originalData: FormData;
    wasSubmitted: boolean;
    validation: Validation;
};

interface GetOnChangeFn {
    name: string;
    beforeChange: any;
}

export const FormContext = React.createContext<FormAPI>(null);

export const useForm = () => {
    return useContext(FormContext);
};

export const useBind = (props: BindComponentProps) => {
    const form = useForm();

    useEffect(() => {
        if (props.defaultValue !== undefined && _.get(form.data, props.name) === undefined) {
            form.setValue(props.name, props.defaultValue);
        }
    }, []);

    // @ts-ignore
    return form.createField(props);
};

export const Form = React.forwardRef((props: FormProps, ref) => {
    const [state, setState] = useState(() => ({
        data: props.data || {},
        originalData: props.data || {},
        wasSubmitted: false,
        validation: {}
    }));

    const [prevData, setPrevData] = useState(null);

    // This simulates "getDerivedStateFromProps"
    if (props.data !== prevData) {
        setPrevData(props.data);

        // If we received new `data`, overwrite current `data` in the state
        if (!_.isEqual(state.originalData, props.data)) {
            setState(state => ({
                ...state,
                data: props.data,
                originalData: props.data,
                validation: {}
            }));
        }

        // Check for validation errors
        let validation = _.cloneDeep(state.validation);
        if (_.isPlainObject(props.invalidFields) && Object.keys(props.invalidFields).length) {
            _.each(props.invalidFields, (message, name) => {
                validation = {
                    ...validation,
                    [name]: {
                        isValid: false,
                        message
                    }
                };
            });
        }

        // Return new state only if something has changed
        if (!_.isEqual(validation, state.validation)) {
            setState(state => ({ ...state, validation }));
        }
    }

    const inputs = useRef({});
    const afterChange = useRef({});
    const lastRender = useRef([]);
    const validateFns = useRef({});
    const onChangeFns = useRef({});

    const getOnChangeFn = ({ name, beforeChange }: GetOnChangeFn) => {
        if (!onChangeFns.current[name]) {
            const linkStateChange = (
                value: any,
                inlineCallback: Function = _.noop
            ): Promise<any> => {
                return new Promise(resolve => {
                    afterChange.current[name] = true;
                    setState(state => set(`data.${name}`, value, state));
                    if (typeof inlineCallback === "function") {
                        inlineCallback(value);
                    }
                    resolve(value);
                });
            };

            onChangeFns.current[name] = beforeChange
                ? newValue => beforeChange(newValue, linkStateChange)
                : linkStateChange;
        }

        return onChangeFns.current[name];
    };

    const getValidateFn = (name: string) => {
        if (!validateFns.current[name]) {
            validateFns.current[name] = () => validateInput(name);
        }

        return validateFns.current[name];
    };

    const formRef = useRef(null);
    const stateRef = useRef(null);

    useEffect(() => {
        Object.keys(inputs.current).forEach(name => {
            if (!lastRender.current.includes(name)) {
                delete inputs.current[name];
                setState((state: State) => {
                    const validation = { ...state.validation };
                    delete validation[name];
                    return { ...state, validation };
                });
            }
        });

        formRef.current = getFormRef();
        stateRef.current = state;
    });

    useEffect(() => {
        Object.keys(afterChange.current).forEach(name => {
            delete afterChange.current[name];

            // call the Form onChange with updated data
            if (typeof props.onChange === "function") {
                props.onChange({ ...formRef.current.data }, formRef.current);
            }

            // Execute onAfterChange
            if (inputs.current[name].afterChange) {
                inputs.current[name].afterChange(
                    _.get(formRef.current.data, name),
                    formRef.current
                );
            }
        });
    });

    useImperativeHandle(ref, () => ({
        submit: () => formRef.current.submit()
    }));

    const executeValidators = async (
        value: any,
        validators: Function | Array<Function>,
        formData: Object = {}
    ): Promise<any> => {
        validators = Array.isArray(validators) ? [...validators] : [validators];

        const results = {};
        for (let i = 0; i < validators.length; i++) {
            const validator = validators[i];
            try {
                await Promise.resolve(validator(value, formData))
                    .then(result => {
                        if (result instanceof Error) {
                            throw result;
                        }
                        results[i] = result;
                    })
                    .catch(e => {
                        throw new ValidationError(e.message, value);
                    });
            } catch (e) {
                throw new ValidationError(e.message, value);
            }
        }

        return results;
    };

    const onInvalid = () => {
        if (typeof props.onInvalid === "function") {
            props.onInvalid();
        }
    };

    /**
     * MAIN FORM ACTION METHODS
     */
    const submit = (event?: React.SyntheticEvent<any, any>): Promise<any> => {
        // If event is present - prevent default behaviour
        if (event && event.preventDefault) {
            event.preventDefault();
        }

        setState(state => ({ ...state, wasSubmitted: true }));

        return validate().then(valid => {
            if (valid) {
                let { data } = state;

                // Make sure all current inputs have a value in the model (defaultValues do not exist in form data)
                const inputNames = Object.keys(inputs.current);
                inputNames.forEach(name => {
                    const defaultValue = inputs.current[name].defaultValue;
                    if (!_.has(data, name) && typeof defaultValue !== "undefined") {
                        data = set(name, defaultValue, data);
                    }
                });

                if (props.onSubmit) {
                    return props.onSubmit(data, formRef.current);
                }
                return;
            }
            return onInvalid();
        });
    };

    const validate = async () => {
        const { data = {}, validation = {} } = state;
        const promises = Object.keys(inputs.current).map(async (name): Promise<boolean> => {
            const { validators } = inputs.current[name];
            if (!validators || validators.length === 0) {
                return true;
            }
            const hasValue = !!data[name];
            const isInputValid = validation[name] ? validation[name].isValid : undefined;
            const shouldValidate = !hasValue || (hasValue && isInputValid !== true);
            if (!shouldValidate) {
                return true;
            }
            if (isInputValid) {
                return true;
            }
            const result = await validateInput(name);
            return result !== false;
        });

        const results = await Promise.all(promises);
        // all values must be true to pass the validation
        return results.every(value => value === true);
    };

    const validateInput = async (name: string) => {
        // Want to know why this nonsense is here?
        // When you have a <Tabs> component which has an <Input>, and you try to switch tabs
        // while your input is focused, Tabs end up in an eternal switching loop.
        // I know this is a `webiny-form` package and has nothing to do with
        // who uses it from the outside, but there is no time to come up with a better solution :(
        await new Promise(res => setTimeout(res, 10));

        // Proceed with validation...
        if (
            (props.validateOnFirstSubmit && !stateRef.current.wasSubmitted) ||
            !inputs.current[name]
        ) {
            return Promise.resolve(null);
        }
        const value = _.get(stateRef.current.data, name, inputs.current[name].defaultValue);
        const { validators } = inputs.current[name];
        const hasValidators = _.keys(validators).length;

        // Validate input
        const formData = {
            inputs: inputs.current,
            data: { ...stateRef.current.data }
        };

        setState(state => ({
            ...state,
            validation: {
                ...state.validation,
                [name]: {
                    ...state.validation[name],
                    isValidating: true
                }
            }
        }));

        return Promise.resolve(executeValidators(value, validators, formData))
            .then(validationResults => {
                const isValid = hasValidators ? (value === null ? null : true) : null;

                setState(state => ({
                    ...state,
                    validation: {
                        ...state.validation,
                        [name]: {
                            isValid,
                            message: null,
                            results: validationResults
                        }
                    }
                }));

                return validationResults;
            })
            .catch(validationError => {
                // Set component state to reflect validation error
                setState(state => ({
                    ...state,
                    validation: {
                        ...state.validation,
                        [name]: {
                            isValid: false,
                            message: validationError.getMessage(),
                            results: false
                        }
                    }
                }));

                return false;
            });
    };

    const setValue = (name: string, value: any) => {
        onChangeFns.current[name](value);
    };

    const __onKeyDown = (e: React.KeyboardEvent<any>) => {
        const { submitOnEnter = false } = props;
        if (
            (submitOnEnter || e.metaKey || e.ctrlKey) &&
            e.key === "Enter" &&
            !e.isDefaultPrevented()
        ) {
            // Need to blur current target in case of input fields to trigger validation
            // @ts-ignore
            e.target && e.target.blur();
            e.preventDefault();
            e.stopPropagation();
            // Fire submit with a small delay to allow input validation to complete.
            // Not an ideal solution but works fine at this point. Will revisit this later.
            setTimeout(() => submit(), 100);
        }
    };

    const isDisabled = () => {
        if (props.disabled) {
            const inputDisabledByForm =
                typeof props.disabled === "function"
                    ? props.disabled({ data: { ...state.data } })
                    : props.disabled;
            // Only override the input prop if the entire Form is disabled
            if (inputDisabledByForm) {
                return true;
            }
        }
        return false;
    };

    const getValidationState = name => {
        return (
            state.validation[name] || {
                isValid: null,
                message: null,
                results: null
            }
        );
    };

    const createField = (props: BindComponentProps) => {
        const { name, validators = [], defaultValue, beforeChange, afterChange } = props;

        // Track component rendering
        lastRender.current.push(name);

        // Store validators and custom messages
        inputs.current[name] = { defaultValue, validators, afterChange };

        return {
            form: formRef.current,
            disabled: isDisabled(),
            validate: getValidateFn(name),
            validation: getValidationState(name),
            value: _.get(state.data, name, defaultValue),
            onChange: getOnChangeFn({ name, beforeChange })
        };
    };

    const getFormRef = (): FormAPI => ({
        data: state.data,
        setValue,
        validate,
        submit
    });

    lastRender.current = [];

    const children = props.children;
    if (!_.isFunction(children)) {
        throw new Error("Form must have a function as its only child!");
    }

    const formContext = useMemo(() => {
        return {
            ...getFormRef(),
            createField
        };
    }, [state]);

    return (
        <FormContext.Provider value={formContext}>
            {React.createElement(
                "webiny-form-container",
                { onKeyDown: __onKeyDown },
                children({
                    data: state.data,
                    setValue,
                    form: getFormRef(),
                    submit,
                    Bind
                })
            )}
        </FormContext.Provider>
    );
});

Form.defaultProps = {
    data: {},
    disabled: false,
    validateOnFirstSubmit: false,
    onSubmit: null
};
