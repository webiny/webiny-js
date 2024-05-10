import { FormPresenter } from "~/FormPresenter";
import { BindComponentProps, FormOnSubmit, FormPropsState, FormValidationOptions } from "~/types";

export interface FormApiOptions<T> {
    onSubmit: FormOnSubmit<T>;
    isFormDisabled: boolean | ((state: FormPropsState<T>) => boolean);
    validateOnFirstSubmit: boolean;
}

export class FormAPI<T> {
    private presenter: FormPresenter<T>;
    private readonly options: FormApiOptions<T>;
    private wasSubmitted = false;

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

    isDisabled = () => {
        const isFormDisabled = this.options.isFormDisabled;
        if (isFormDisabled) {
            const inputDisabledByForm =
                typeof isFormDisabled === "function"
                    ? isFormDisabled({ data: { ...this.presenter.vm.data } })
                    : isFormDisabled;

            // Only override the input prop if the entire Form is disabled
            if (inputDisabledByForm) {
                return true;
            }
        }
        return false;
    };

    registerField = (props: BindComponentProps) => {
        this.presenter.registerField(props);

        const validation = this.presenter.getFieldValidation(props.name);

        return {
            disabled: this.isDisabled(),
            validate: () => this.validateInput(props.name),
            validation,
            value: this.presenter.getFieldValue(props.name),
            form: this as FormAPI<any>,
            onChange: async (value: unknown) => {
                await this.presenter.setFieldValue(props.name, value);

                if (this.shouldValidate()) {
                    this.presenter.validateField(props.name);
                }
            }
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
}
