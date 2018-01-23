// @flow
import _ from "lodash";
import ValidationError from "./validationError";

const entries = (validators: ParsedValidators): Array<[string, Array<string>]> => {
    return (Object.entries(validators): any);
};

const invalidRules = "Validators must be specified as a string (eg. required,minLength:10,email).";

/**
 * Validation class instance is the main container for all validators.
 * When you need to validate something, you will be interacting directly with this class.
 * It provides methods for both async and sync validation and also allows you to add new and overwrite existing validators.
 *
 * @class Validation
 * @example
 * import { validation } from 'webiny-validation';
 *
 * // `validation` is a preconfigured instance of Validation class
 * // From here you can either add new validators or use it as-is
 */
class Validation {
    validators: { [string]: Validator };

    constructor() {
        this.validators = {};
    }

    /**
     * Add new validator
     * @param name Validator name
     * @param callable Validator function which should throw a ValidationError if validation fails
     */
    setValidator(name: string, callable: Validator): void {
        this.validators[name] = callable;
    }

    /**
     * Get validator function by name
     * @param name Validator name
     */
    getValidator(name: string): Validator {
        if (!this.validators[name]) {
            throw new ValidationError("Validator `" + name + "` does not exist!", name);
        }
        return this.validators[name];
    }

    /**
     * Parse a string of validators with parameters
     * @param rules A string of validators with parameters
     * @private
     */
    parseValidateProperty(rules: string): ParsedValidators {
        let validate: Array<string> = rules.split(",");

        const validators: ParsedValidators = {};
        validate.forEach((v: string) => {
            let params = _.trim(v).split(":");
            let vName = params.shift();
            validators[vName] = params;
        });
        return validators;
    }

    /**
     * Validate the given value using given validation rules
     * @param value A value to validate
     * @param rules A string of validators with parameters
     * @param options (Optional) Validation options
     */
    async validate(
        value: any,
        rules: string,
        options: ValidateOptions = {}
    ): Promise<boolean | ValidationErrorValue> {
        if (_.isString(rules) && _.isEmpty(rules)) {
            return true;
        }

        if (!_.isString(rules)) {
            throw new Error(invalidRules);
        }

        const validators = this.parseValidateProperty(rules);

        for (const [name, params] of entries(validators)) {
            const validator = this.getValidator(name);
            try {
                await validator(value, params);
            } catch (e) {
                if (options.throw === false) {
                    return { message: e.message, name, value };
                }
                throw new ValidationError(e.message, name, value);
            }
        }
        return true;
    }

    /**
     * Validate the given value using given validation rules
     * @param value A value to validate
     * @param rules A string of validators with parameters
     * @param options (Optional) Validation options
     */
    validateSync(
        value: any,
        rules: string,
        options: ValidateOptions = {}
    ): boolean | ValidationErrorValue {
        if (_.isString(rules) && _.isEmpty(rules)) {
            return true;
        }

        if (!_.isString(rules)) {
            throw new Error(invalidRules);
        }

        const validators = this.parseValidateProperty(rules);

        for (const [name, params] of entries(validators)) {
            const validator = this.getValidator(name);
            try {
                validator(value, params);
            } catch (e) {
                if (options.throw === false) {
                    return { message: e.message, name, value };
                }
                throw new ValidationError(e.message, name, value);
            }
        }
        return true;
    }
}

export default Validation;
