import lodashNoop from "lodash/noop";
import { BindComponentProps, FormAPI, FormValidationOptions } from "~/types";
import { Validator } from "@webiny/validation/types";
import { FieldValidationResult, FormFieldValidator } from "./FormFieldValidator";

interface BeforeChange {
    (value: unknown, cb: (value: unknown) => void): void;
}

interface AfterChange {
    (value: unknown, form: FormAPI): void;
}

const defaultBeforeChange: BeforeChange = (value, cb) => cb(value);

const defaultAfterChange = lodashNoop;

export class FormField {
    private readonly name: string;
    private readonly defaultValue: unknown;
    private validator: FormFieldValidator | undefined;
    private beforeChange?: BeforeChange;
    private afterChange?: AfterChange;
    private validation: FieldValidationResult | undefined = undefined;

    private constructor(props: BindComponentProps) {
        this.name = props.name;
        this.defaultValue = props.defaultValue;
        this.beforeChange = props.beforeChange;
        this.afterChange = props.afterChange;
        this.setValidators(props.validators);
    }

    static create(props: BindComponentProps) {
        return new FormField(props);
    }

    async validate(
        value: unknown,
        options?: FormValidationOptions
    ): Promise<FieldValidationResult> {
        this.validation = await this.validator!.validate(value, options || { skipValidators: [] });
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

    setBeforeChange(cb: BeforeChange | undefined) {
        this.beforeChange = cb;
    }

    setAfterChange(cb: AfterChange | undefined) {
        this.afterChange = cb;
    }

    setValidators(validators: Validator | Validator[] | undefined) {
        let normalized: Validator[] = [];
        if (!validators) {
            normalized = [];
        } else if (!Array.isArray(validators)) {
            normalized = [validators as Validator];
        } else {
            normalized = validators;
        }

        this.validator = new FormFieldValidator(normalized);
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
