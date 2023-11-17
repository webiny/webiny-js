import React, {
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState
} from "react";
import lodashGet from "lodash/get";
import lodashCloneDeep from "lodash/cloneDeep";
import lodashIsPlainObject from "lodash/isPlainObject";
import lodashIsEqual from "lodash/isEqual";
import lodashNoop from "lodash/noop";
import lodashEach from "lodash/each";
import lodashHas from "lodash/has";
import set from "lodash/fp/set";
import { Bind } from "./Bind";
import ValidationError from "./ValidationError";
import {
    BindComponentProps,
    FormAPI,
    FormProps,
    FormSubmitOptions,
    GenericFormData,
    UseBindHook,
    Validation
} from "~/types";
import { Validator } from "@webiny/validation/types";
import camelCase from "lodash/camelCase";

interface State<T extends GenericFormData = GenericFormData> {
    data: T;
    originalData: T;
    wasSubmitted: boolean;
    validation: Validation;
    options?: FormSubmitOptions;
}

interface GetOnChangeFn {
    name: string;
    beforeChange: any;
}

interface OnChangeCallable {
    (value?: any): void;
}

interface OnValidateCallable {
    (): void;
}

export const FormContext = React.createContext<FormAPI>(undefined as unknown as FormAPI);

export const useForm = <T extends GenericFormData = GenericFormData>() => {
    return useContext(FormContext) as FormAPI<T>;
};

export function useBind<T = any>(props: BindComponentProps<T>): UseBindHook<T> {
    const form = useForm();

    useEffect(() => {
        if (props.defaultValue !== undefined && lodashGet(form.data, props.name) === undefined) {
            form.setValue(props.name, props.defaultValue);
        }
    }, []);

    // @ts-expect-error
    return form.createField(props);
}

interface InputRecord {
    defaultValue: unknown;
    validators: Validator[];
    afterChange?: (value: unknown, form: FormAPI) => void;
}

function FormInner<T extends GenericFormData = GenericFormData>(
    props: FormProps<T>,
    ref: React.ForwardedRef<any>
) {
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const [state, setState] = useState<State<T>>({
        data: props.data as T,
        originalData: (props.data || {}) as T,
        wasSubmitted: false,
        validation: {}
    });

    const [prevData, setPrevData] = useState<Partial<T> | null>(null);
    const [prevInvalidFields, setPrevInvalidFields] =
        useState<FormProps["invalidFields"]>(undefined);

    // This simulates "getDerivedStateFromProps"
    if (props.data !== prevData) {
        setPrevData(() => {
            return props.data || null;
        });

        // If we received new `data`, overwrite current `data` in the state
        if (!lodashIsEqual(state.originalData, props.data)) {
            setState(state => ({
                ...state,
                data: (props.data || {}) as T,
                originalData: (props.data || {}) as T,
                validation: {}
            }));
        }
    }

    if (props.invalidFields !== prevInvalidFields) {
        setPrevInvalidFields(() => {
            return props.invalidFields || undefined;
        });
        // Check for validation errors
        let validation = lodashCloneDeep(state.validation);
        if (
            lodashIsPlainObject(props.invalidFields) &&
            Object.keys(props.invalidFields || {}).length
        ) {
            lodashEach(props.invalidFields, (message, name) => {
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
        if (!lodashIsEqual(validation, state.validation)) {
            setState(state => ({ ...state, validation }));
        }
    }

    const inputs = useRef<Record<string, InputRecord>>({});
    const afterChange = useRef<Record<string, boolean>>({});
    const lastRender = useRef<string[]>([]);
    const validateFns = useRef<Record<string, OnValidateCallable>>({});
    const onChangeFns = useRef<Record<string, OnChangeCallable>>({});

    const getOnChangeFn = ({ name, beforeChange }: GetOnChangeFn) => {
        if (!onChangeFns.current[name]) {
            const linkStateChange = (
                value: unknown,
                inlineCallback: Function = lodashNoop
            ): Promise<unknown> => {
                return new Promise(resolve => {
                    afterChange.current[name] = true;
                    setState(state => {
                        const next = set(
                            `validation.${name}`,
                            {
                                isValid: undefined,
                                message: undefined,
                                results: false
                            },
                            state
                        );
                        return set(`data.${name}`, value, next);
                    });
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
    /**
     * We need to cast to avoid a lot of casting later on.
     */
    const formRef = useRef<FormAPI<T>>(undefined as unknown as FormAPI<T>);
    const stateRef = useRef<State<T>>({
        data: {} as T,
        originalData: {} as T,
        validation: [],
        wasSubmitted: false
    });

    useEffect(() => {
        Object.keys(inputs.current).forEach((name: string) => {
            if (lastRender.current.includes(name)) {
                return;
            }
            delete inputs.current[name];
            setState((state: State<T>) => {
                const validation = { ...state.validation };
                delete validation[name];
                return { ...state, validation };
            });
        });

        formRef.current = getFormRef();
        stateRef.current = state;
    });

    useEffect(() => {
        Object.keys(afterChange.current).forEach(name => {
            delete afterChange.current[name];

            // call the Form onChange with updated data
            if (typeof props.onChange === "function") {
                props.onChange({ ...formRef.current.data } as T, formRef.current);
            }

            // Execute onAfterChange
            const callable = inputs.current[name] ? inputs.current[name].afterChange : null;
            if (!callable) {
                return;
            }
            callable(lodashGet(formRef.current.data, name), formRef.current);
        });
    });

    useImperativeHandle(ref, () => ({
        submit: (ev: React.SyntheticEvent, options?: FormSubmitOptions) => {
            /**
             * We need to `return` to utilize the `props.onSubmit` return value. It's useful for plugins and chaining
             * of `onSubmit` callbacks, where return value needs to be passed to the next handler.
             */
            return formRef.current.submit(ev, options);
        }
    }));

    const executeValidators = async (
        value: any,
        validators: Validator[]
    ): Promise<Record<string, any>> => {
        const results: Record<string, string> = {};
        for (const index in validators) {
            const validator = validators[index];
            try {
                await Promise.resolve(validator(value))
                    .then((result: any) => {
                        if (result instanceof Error) {
                            throw result;
                        }
                        results[index] = result;
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
    const submit = (
        event?: React.SyntheticEvent<any, any>,
        options?: FormSubmitOptions
    ): Promise<any> => {
        // If event is present - prevent default behaviour
        if (event && event.preventDefault) {
            event.preventDefault();
        }

        setState(state => ({ ...state, wasSubmitted: true, options }));

        return validate(options).then(valid => {
            if (valid) {
                let { data } = state;

                // Make sure all current inputs have a value in the model (defaultValues do not exist in form data)
                const inputNames = Object.keys(inputs.current);
                inputNames.forEach(name => {
                    const defaultValue = inputs.current[name].defaultValue;
                    if (!lodashHas(data, name) && typeof defaultValue !== "undefined") {
                        data = set(name, defaultValue, data);
                    }
                });

                if (props.onSubmit) {
                    return props.onSubmit(data as T, formRef.current);
                }
                return;
            }
            return onInvalid();
        });
    };

    const validate = async (options?: FormSubmitOptions) => {
        const { data, validation = {} } = state;
        const promises = Object.keys(inputs.current).map(async (name): Promise<boolean> => {
            const { validators } = inputs.current[name];
            if (!validators || validators.length === 0) {
                return true;
            }
            const hasValue = Boolean(data[name]);
            const isInputValid = validation[name] ? validation[name].isValid : undefined;
            const shouldValidate = !hasValue || (hasValue && isInputValid !== true);
            if (!shouldValidate) {
                return true;
            }
            if (isInputValid) {
                return true;
            }
            const result = await validateInput(name, options);
            return result !== false;
        });

        const results = await Promise.all(promises);
        // all values must be true to pass the validation
        return results.every(value => value);
    };

    const validateInput = async (name: string, options?: FormSubmitOptions) => {
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
        const value = lodashGet(stateRef.current.data, name, inputs.current[name].defaultValue);
        const { validators: initialValidators } = inputs.current[name];
        /**
         * We need to filter out validators which are being skipped
         */
        const skipValidators = options?.skipValidators;
        const validators = initialValidators.filter(validator => {
            if (!validator.validatorName || !skipValidators) {
                return true;
            }
            /**
             * We need to remove the validators which are in the skipValidators array, thus the ! before the checks.
             */
            return !(
                skipValidators.includes(validator.validatorName) ||
                skipValidators.includes(camelCase(validator.validatorName))
            );
        });

        const hasValidators = Object.keys(validators).length > 0;

        if (isMounted.current) {
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
        }

        return await Promise.resolve(executeValidators(value, validators))
            .then(validationResults => {
                const isValid = hasValidators ? (value === null ? null : true) : null;

                if (isMounted.current) {
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
                }

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

    const getValidationState = (name: string): Validation => {
        return (
            state.validation[name] || {
                isValid: null,
                message: null,
                results: null
            }
        );
    };

    const createField = (props: BindComponentProps) => {
        const { name, defaultValue, beforeChange, afterChange } = props;

        let validators = props.validators || [];
        /**
         * If there is no validators defined, lets make it empty array.
         * If there is validator defined, we expect array further on, so create it.
         */
        if (!validators) {
            validators = [];
        } else if (Array.isArray(validators) === false) {
            validators = [validators as Validator];
        }
        // Track component rendering
        lastRender.current.push(name);

        // Store validators and custom messages
        inputs.current[name] = {
            defaultValue,
            /**
             * We are sure that validators is an array.
             */
            validators: validators as Validator[],
            afterChange
        };

        return {
            form: getFormRef(),
            disabled: isDisabled(),
            validate: getValidateFn(name),
            validation: getValidationState(name),
            value: lodashGet(state.data, name, defaultValue),
            onChange: getOnChangeFn({ name, beforeChange })
        };
    };

    const getFormRef = (): FormAPI<T> => ({
        options: state.options || {},
        data: state.data,
        setValue,
        validate,
        validateInput,
        submit
    });

    lastRender.current = [];

    const children = props.children;
    if (typeof children !== "function") {
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
                    options: state.options || {},
                    data: state.data,
                    setValue,
                    form: getFormRef(),
                    submit,
                    Bind
                })
            )}
        </FormContext.Provider>
    );
}

export const Form = React.forwardRef(FormInner) as (<T extends GenericFormData = GenericFormData>(
    props: FormProps<T> & { ref?: React.ForwardedRef<any> }
) => ReturnType<typeof FormInner<T>>) & { defaultProps?: Partial<FormProps> | undefined };

Form.defaultProps = {
    data: {},
    disabled: false,
    validateOnFirstSubmit: false,
    onSubmit: () => {
        return void 0;
    }
};
