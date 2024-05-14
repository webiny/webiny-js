import { makeAutoObservable, runInAction, toJS } from "mobx";
import lodashGet from "lodash/get";
import lodashSet from "lodash/set";
import lodashNoop from "lodash/noop";
import { BindComponentProps, FormValidationOptions, GenericFormData } from "~/types";
import { FormField } from "./FormField";
import { FormValidator } from "./FormValidator";
import { FieldValidationResult } from "./FormFieldValidator";

interface FormInvalidFields {
    [name: string]: string;
}

interface FormOnChange<T> {
    (data: T): void;
}

interface FormOnInvalid {
    (invalidFormFields: InvalidFormFields): void;
}

interface FormInit<T> {
    data: T;
    onChange?: FormOnChange<T>;
    onInvalid?: FormOnInvalid;
}

export interface InvalidFormFields {
    [name: string]: FieldValidationResult;
}

export class FormPresenter<T extends GenericFormData = GenericFormData> {
    /* Holds the current form data. */
    private data: T;
    /* Holds form fields definitions. */
    private formFields = new Map<string, FormField>();
    /* Holds invalid fields state. */
    private invalidFields: InvalidFormFields = {};
    private onFormChange: FormOnChange<T>;
    private onFormInvalid: FormOnInvalid;

    constructor() {
        this.data = {} as T;
        this.onFormChange = lodashNoop;
        this.onFormInvalid = lodashNoop;

        makeAutoObservable(this);
    }

    init(params: FormInit<T>) {
        this.setData(params.data);
        if (params.onChange) {
            this.onFormChange = params.onChange;
        }

        if (params.onInvalid) {
            this.onFormInvalid = params.onInvalid;
        }
    }

    get vm() {
        return {
            data: toJS(this.data),
            invalidFields: toJS(this.invalidFields),
            formFields: this.formFields
        };
    }

    setData(data: T) {
        this.data = data || {};
    }

    getFieldValue(name: string) {
        return lodashGet(this.data, name);
    }

    getFieldValidation(name: string): FieldValidationResult {
        const field = this.formFields.get(name);
        if (!field) {
            return {
                isValid: null
            };
        }

        if (name in this.invalidFields) {
            return this.invalidFields[name];
        }

        return (
            toJS(field.getValidation()) ?? {
                isValid: null
            }
        );
    }

    setFieldValue(name: string, value: unknown) {
        const field = this.formFields.get(name);
        if (!field) {
            return;
        }

        /**
         * We delegate field value handling to the FormField class.
         */
        field.setValue(value, value => {
            this.commitValueToData(name, value);
        });
    }

    async validateField(name: string, options?: FormValidationOptions) {
        const field = this.formFields.get(name);
        if (!field) {
            console.warn(`Field "${name}" doesn't exist in the form!`);
            return undefined;
        }

        const fieldValue = lodashGet(this.data, name, field.getDefaultValue());
        const validation = await field.validate(fieldValue, options);

        runInAction(() => {
            if (!validation.isValid) {
                this.invalidFields = { ...this.invalidFields, [name]: validation };
            } else {
                delete this.invalidFields[name];
            }
        });

        return validation;
    }

    setInvalidFields(fields: FormInvalidFields) {
        this.invalidFields = Object.keys(fields).reduce((acc, key) => {
            return {
                ...acc,
                [key]: {
                    isValid: false,
                    message: fields[key]
                }
            };
        }, {});
    }

    registerField(props: BindComponentProps) {
        const existingField = this.formFields.get(props.name);

        let field: FormField;
        if (existingField) {
            field = FormField.createFrom(existingField, props);
        } else {
            field = FormField.create(props);
        }

        // We only want to handle default field value for new fields.
        if (!existingField) {
            const fieldName = field.getName();
            const currentFieldValue = lodashGet(this.data, fieldName);
            const defaultValue = field.getDefaultValue();
            if (currentFieldValue === undefined && defaultValue !== undefined) {
                lodashSet(this.data, fieldName, defaultValue);
            }
        }

        this.formFields.set(props.name, field);
    }

    unregisterField(name: string) {
        this.formFields.delete(name);
    }

    async validate(options?: FormValidationOptions) {
        const validation = new FormValidator(Array.from(this.formFields.values()));
        const { isValid, invalidFields } = await validation.validate(toJS(this.data), options);

        runInAction(() => {
            this.invalidFields = invalidFields;
            if (!isValid) {
                this.onFormInvalid(invalidFields);
            }
        });

        return isValid;
    }

    private commitValueToData = (name: string, value: unknown) => {
        lodashSet(this.data, name, value);
        this.onFormChange(toJS(this.data));
    };
}
