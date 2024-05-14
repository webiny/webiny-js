import lodashCamelCase from "lodash/camelCase";
import { Validator } from "@webiny/validation/types";
import { ValidationError } from "~/ValidationError";
import { FormValidationOptions } from "~/types";

export interface FieldValidationResult {
    isValid: boolean | null;
    message?: string;
    results?: {
        [key: string]: any;
    };
}

export class FormFieldValidator {
    private readonly validators: Validator[];

    constructor(validators: Validator[]) {
        this.validators = validators;
    }

    async validate(value: unknown, options: FormValidationOptions): Promise<FieldValidationResult> {
        if (this.validators.length === 0) {
            return {
                isValid: true
            };
        }

        const validators = this.getApplicableValidators(options);
        for (const validator of validators) {
            try {
                await Promise.resolve(validator(value))
                    .then((result: any) => {
                        if (result instanceof Error) {
                            throw result;
                        }
                    })
                    .catch(e => {
                        throw new ValidationError(e.message, value);
                    });
            } catch (e) {
                return {
                    isValid: false,
                    message: e.message
                };
            }
        }

        return {
            isValid: true
        };
    }

    private getApplicableValidators({ skipValidators = [] }: FormValidationOptions) {
        return this.validators.filter(validator => {
            if (!validator.validatorName || !skipValidators) {
                return true;
            }
            /**
             * We need to remove the validators which are in the skipValidators array, thus the ! before the checks.
             */
            return !(
                skipValidators.includes(validator.validatorName) ||
                skipValidators.includes(lodashCamelCase(validator.validatorName))
            );
        });
    }
}
