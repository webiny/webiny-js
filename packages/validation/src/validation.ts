import isString from "lodash/isString";
import isEmpty from "lodash/isEmpty";
import trim from "lodash/trim";
import ValidationError from "./validationError";
import { ParsedValidators, ValidateOptions, Validator } from "./types";

const entries = (validators: ParsedValidators): Array<[string, Array<string>]> => {
    return Object.entries(validators);
};

const invalidRules = "Validators must be specified as a string (eg. required,minLength:10,email).";

interface CreatedValidators {
    async: Record<string, Validator>;
    sync: Record<string, Validator>;
}
const createdValidators: CreatedValidators = {
    async: {},
    sync: {}
};

/**
 * Main class of Validation library.
 * Exported as a singleton instance, it offers methods for sync/async data validation and overwriting or adding new validators.
 *
 * @class Validation
 * @example
 * import { validation } from '@webiny/validation';
 *
 * // `validation` is a preconfigured instance of Validation class.
 * // From here you can either add new validators or use it as-is.
 */
class Validation {
    /**
     * Contains a list of all set validators.
     * @private
     */
    __validators: {
        [key: string]: Validator;
    };

    constructor() {
        this.__validators = {};
    }

    /**
     * Add new validator.
     * @param name Validator name.
     * @param callable Validator function which throws a ValidationError if validation fails.
     * @returns {Validation}
     */
    setValidator(name: string, callable: Validator): this {
        this.__validators[name] = callable;
        this.__validators[name].validatorName = name;
        return this;
    }

    /**
     * Get validator function by name.
     * @param name Validator name.
     * @returns {Validator} A validator function.
     */
    getValidator(name: string): Validator {
        if (!this.__validators[name]) {
            throw new ValidationError("Validator `" + name + "` does not exist!", name);
        }
        return this.__validators[name];
    }

    /**
     * Asynchronously validates value.
     * @param value Value to validate.
     * @param validators A list of comma-separated validators (eg. required,number,gt:20).
     * @param [options] Validation options.
     * @returns {Promise<boolean | ValidationError>}
     */
    async validate(
        value: any,
        validators: string,
        options: ValidateOptions = {}
    ): Promise<boolean | ValidationError> {
        if (isString(validators) && isEmpty(validators)) {
            return true;
        }

        if (!isString(validators)) {
            throw new Error(invalidRules);
        }

        const parsedValidateProperty = this.__parseValidateProperty(validators);

        for (const [name, params] of entries(parsedValidateProperty)) {
            const validator = this.getValidator(name);
            try {
                await validator(value, params);
            } catch (e) {
                const validationError = new ValidationError(e.message, name, value);
                if (options.throw === false) {
                    return validationError;
                }
                throw validationError;
            }
        }
        return true;
    }

    /**
     * Synchronously validates value.
     * @param value Value to validate.
     * @param validators A list of comma-separated validators (eg. required,number,gt:20).
     * @param [options] Validation options.
     * @returns {Promise<boolean | ValidationError>}
     */
    validateSync(
        value: any,
        validators: string,
        options: ValidateOptions = {}
    ): boolean | ValidationError {
        if (isString(validators) && isEmpty(validators)) {
            return true;
        }

        if (!isString(validators)) {
            throw new Error(invalidRules);
        }

        const parsedValidateProperty = this.__parseValidateProperty(validators);

        for (const [name, params] of entries(parsedValidateProperty)) {
            const validator = this.getValidator(name);
            try {
                validator(value, params);
            } catch (e) {
                const validationError = new ValidationError(e.message, name, value);
                if (options.throw === false) {
                    return validationError;
                }
                throw validationError;
            }
        }
        return true;
    }

    create(validators: string) {
        if (createdValidators.async[validators]) {
            return createdValidators.async[validators];
        }

        createdValidators.async[validators] = value => this.validate(value, validators);
        return createdValidators.async[validators];
    }

    createSync(validators: string) {
        if (createdValidators.sync[validators]) {
            return createdValidators.sync[validators];
        }

        createdValidators.sync[validators] = value => this.validateSync(value, validators);
        return createdValidators.sync[validators];
    }

    /**
     * Parses a string of validators with parameters.
     * @param validators A list of comma-separated validators (eg. required,number,gt:20).
     * @returns {ParsedValidators}
     * @private
     */
    __parseValidateProperty(validators: string): ParsedValidators {
        const validate: Array<string> = validators.split(",");

        const parsedValidators: ParsedValidators = {};
        validate.forEach((v: string) => {
            const params = trim(v).split(":");
            const vName = params.shift();
            if (!vName) {
                return;
            }
            parsedValidators[vName] = params;
        });
        return parsedValidators;
    }
}

export default Validation;
