// @flow
import _ from 'lodash';
import ValidationError from './validationError';

declare type Validator = (value: any, parameters?: Array<any>) => boolean;

declare type ParsedValidators = { [string]: Array<string> };

declare type ValidationErrorValue = {
    message: string,
    name: string,
    value: any
};

declare type ValidateOptions = {
    throw?: boolean
};

const entries = (validators: ParsedValidators): Array<[string, Array<string>]> => {
    return (Object.entries(validators): any);
};

const invalidRules = 'Validators must be specified as a string (eg. required,minLength:10,email).';


class Validation {
    validators: { [string]: Validator };

    constructor() {
        this.validators = {};
    }

    setValidator(name: string, callable: Validator): void {
        this.validators[name] = callable;
    }

    getValidator(name: string): Validator {
        if (!this.validators[name]) {
            throw new ValidationError('Validator `' + name + '` does not exist!', name);
        }
        return this.validators[name];
    }

    parseValidateProperty(rules: string): ParsedValidators {
        let validate: Array<string> = rules.split(',');

        const validators: ParsedValidators = {};
        validate.forEach((v: string) => {
            let params = _.trim(v).split(':');
            let vName = params.shift();
            validators[vName] = params;
        });
        return validators;
    }

    async validate(value: any, rules: string, options: ValidateOptions = {}): Promise<boolean | ValidationErrorValue> {
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

    validateSync(value: any, rules: string, options: ValidateOptions = {}): boolean | ValidationErrorValue {
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