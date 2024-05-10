import { BindComponentProps, FormAPI, FormValidationOptions } from "~/types";
import { Validator } from "@webiny/validation/types";
import { FieldValidationResult, FormFieldValidator } from "./FormFieldValidator";

interface BeforeChange {
    (value: unknown, cb: (value: unknown) => void): void;
}

export class FormField {
    private readonly name: string;
    private readonly defaultValue: unknown;
    private validator: FormFieldValidator;
    private readonly beforeChange?: BeforeChange;
    private readonly afterChange?: (value: unknown, form: FormAPI) => void;
    private validation: FieldValidationResult | undefined = undefined;

    constructor(props: BindComponentProps) {
        this.name = props.name;
        this.defaultValue = props.defaultValue;
        this.beforeChange = props.beforeChange;
        this.afterChange = props.afterChange;

        let validators: Validator[] = [];
        if (!props.validators) {
            validators = [];
        } else if (!Array.isArray(props.validators)) {
            validators = [props.validators as Validator];
        } else {
            validators = props.validators;
        }

        this.validator = new FormFieldValidator(validators);
    }

    static createFrom(field: FormField, props: BindComponentProps) {
        const newField = new FormField(props);
        newField.validation = field.validation;
        return newField;
    }

    async validate(
        value: unknown,
        options?: FormValidationOptions
    ): Promise<FieldValidationResult> {
        this.validation = await this.validator.validate(value, options || { skipValidators: [] });
        return this.validation;
    }

    resetValidation() {
        this.validation = undefined;
    }

    isValid() {
        return this.validation ? this.validation.isValid : undefined;
    }

    getName() {
        return this.name;
    }

    getDefaultValue() {
        return this.defaultValue;
    }

    getBeforeChange() {
        return this.beforeChange;
    }

    getAfterChange() {
        return this.afterChange;
    }

    getValidation() {
        return this.validation;
    }
}
