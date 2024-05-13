import lodashNoop from "lodash/noop";
import { BindComponentProps, FormAPI, FormValidationOptions } from "~/types";
import { Validator } from "@webiny/validation/types";
import { FieldValidationResult, FormFieldValidator } from "./FormFieldValidator";

interface BeforeChange {
    (value: unknown, cb: (value: unknown) => void): void;
}

const defaultBeforeChange: BeforeChange = (value, cb) => cb(value);

const defaultAfterChange = lodashNoop;

export class FormField {
    private readonly name: string;
    private readonly defaultValue: unknown;
    private validator: FormFieldValidator;
    private readonly beforeChange?: BeforeChange;
    private readonly afterChange?: (value: unknown, form: FormAPI) => void;
    private validation: FieldValidationResult | undefined = undefined;

    private constructor(props: BindComponentProps) {
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

    static create(props: BindComponentProps) {
        return new FormField(props);
    }

    async validate(
        value: unknown,
        options?: FormValidationOptions
    ): Promise<FieldValidationResult> {
        this.validation = await this.validator.validate(value, options || { skipValidators: [] });
        return this.validation;
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
        return this.beforeChange ?? defaultBeforeChange;
    }

    getAfterChange() {
        return this.afterChange ?? defaultAfterChange;
    }

    getValidation() {
        return this.validation;
    }

    setValue(value: unknown, cb: (value: unknown) => void) {
        const beforeChange = this.getBeforeChange();
        const afterChange = this.getAfterChange();

        beforeChange(value, value => {
            cb(value);
            afterChange(value);
        });
    }
}
