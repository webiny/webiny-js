import { FormPresenter } from "~/FormPresenter";
import {
    BindComponentProps,
    FormOnSubmit,
    FormPropsState,
    FormValidationOptions,
    UseBindHook
} from "~/types";

export interface FormApiOptions<T> {
    onSubmit: FormOnSubmit<T>;
    isFormDisabled: boolean | ((state: FormPropsState<T>) => boolean);
    validateOnFirstSubmit: boolean;
}

const emptyValues: unknown[] = [undefined, null];

export class FormAPI<T> {
    private presenter: FormPresenter<T>;
    private readonly options: FormApiOptions<T>;
    private wasSubmitted = false;
    private fieldsCache = new Map<string, UseBindHook>();

    constructor(presenter: FormPresenter<T>, options: FormApiOptions<T>) {
        this.presenter = presenter;
        this.options = options;
    }

    setOptions(options: Partial<FormApiOptions<T>>) {
        Object.assign(this.options, options);
    }

    get data() {
        return this.presenter.vm.data;
    }

    get isPristine() {
        return this.presenter.vm.isPristine;
    }

    isDisabled = () => {
        const isFormDisabled = this.options.isFormDisabled;
        if (isFormDisabled) {
            const inputDisabledByForm =
                typeof isFormDisabled === "function" ? isFormDisabled(this) : isFormDisabled;

            // Only override the input prop if the entire Form is disabled
            if (inputDisabledByForm) {
                return true;
            }
        }
        return false;
    };

    registerField = (props: BindComponentProps): UseBindHook => {
        this.presenter.registerField(props);

        if (!this.fieldsCache.has(props.name)) {
            /**
             * We create a reusable template, which will be cached.
             * On subsequent renders, only the dynamic properties will be recalculated.
             */
            this.fieldsCache.set(props.name, {
                disabled: false,
                value: undefined,
                validation: {
                    isValid: null
                },
                validate: () => this.validateInput(props.name),
                onChange: async (value: unknown) => {
                    this.presenter.setFieldValue(props.name, value);

                    if (this.shouldValidate()) {
                        this.presenter.validateField(props.name);
                    }
                }
            });
        }

        const hookValue = this.fieldsCache.get(props.name) as UseBindHook;

        return {
            ...hookValue,
            disabled: this.isDisabled(),
            value: this.valueOrDefault(props),
            validation: this.presenter.getFieldValidation(props.name)
        };
    };

    unregisterField = (name: string) => {
        this.presenter.unregisterField(name);
    };

    submit = async (
        event?: React.SyntheticEvent<any, any>,
        options?: FormValidationOptions
    ): Promise<T | undefined> => {
        if (event && event.preventDefault) {
            event.preventDefault();
        }

        this.wasSubmitted = true;
        const isValid = await this.presenter.validate(options);
        if (isValid) {
            return this.options.onSubmit(this.presenter.vm.data, this);
        }

        return undefined;
    };

    setValue = (name: string, value: unknown) => {
        return this.presenter.setFieldValue(name, value);
    };

    getValue = (name: string) => {
        return this.presenter.getFieldValue(name);
    };

    validate = (options?: FormValidationOptions) => {
        return this.presenter.validate(options);
    };

    validateInput = (name: string) => {
        return this.presenter.validateField(name);
    };

    private shouldValidate() {
        const { validateOnFirstSubmit } = this.options;

        return !validateOnFirstSubmit || (validateOnFirstSubmit && this.wasSubmitted);
    }

    /**
     * We need to use the `defaultValue` from props on the first render, because default value is only available in the
     * form data on the next render cycle (we set it in the `requestAnimationFrame()`). This one render cycle is enough
     * to cause problems, so to avoid issues, we use the immediate props to ensure the correct value is returned.
     * On the second render cycle, the `getFieldValue` will contain the default value, and that's what will be returned.
     * @private
     */
    private valueOrDefault(props: BindComponentProps) {
        const value = this.presenter.getFieldValue(props.name);

        if (emptyValues.includes(value) && props.defaultValue !== undefined) {
            return props.defaultValue;
        }
        return value;
    }
}
