// @flow
import * as React from "react";
import _ from "lodash";
import { validation } from "webiny-validation";
import type { Validator } from "webiny-validation/types";
import ValidationError from "./ValidationError";

class Validation {
    getValidator(name: string): Validator {
        const validator = validation.getValidator(name);
        if (!validator) {
            throw new ValidationError("Validator `" + name + "` does not exist!", name);
        }
        return validator;
    }

    getValidatorsFromProps(props: Object) {
        let { defaultValidators, validators } = props;
        if (!validators) {
            validators = [];
        }

        if (typeof validators === "string") {
            validators = validators.split(",");
        }

        if (defaultValidators) {
            validators.push(defaultValidators);
        }

        return this.parseValidateProperty(validators);
    }

    parseValidateProperty(validators: string | Array<any>): Object {
        if (!validators) {
            return {};
        }

        let validatorsArray = typeof validators === "string" ? validators.split(",") : validators;

        const parsedValidators = {};
        validatorsArray.forEach(v => {
            let validator = null;
            let vName = null;
            if (typeof v === "string") {
                validator = _.trim(v).split(":");
                vName = validator.shift();
            } else {
                validator = v;
                vName = _.uniqueId("validator");
            }
            parsedValidators[vName] = validator;
        });
        return parsedValidators;
    }

    parseCustomValidationMessages(elements: React.Element<*> | Array<React.Element<*>>) {
        const customMessages = {};

        if (!elements) {
            return customMessages;
        }

        if (!Array.isArray(elements)) {
            elements = [elements];
        }

        elements.forEach(item => {
            if (item.type === "validator" && item.props.children) {
                customMessages[item.props.name] = item.props.children;
            }
        });

        return customMessages;
    }

    async validate(value: any, validators: string | Object, formData: Object = {}): Promise<any> {
        if (typeof validators === "string") {
            validators = this.parseValidateProperty(validators);
        }

        const results = {};
        const keys = Object.keys(validators);
        for (let i = 0; i < keys.length; i++) {
            const name = keys[i];

            const funcValidator = typeof validators[name] === "function" ? validators[name] : false;
            const args = funcValidator ? [] : _.clone(validators[name]);

            if (formData.inputs) {
                this.parseArgs(args, formData.inputs);
            }

            args.unshift(value);
            args.push(formData);

            let validator = null;
            try {
                validator = funcValidator
                    ? funcValidator(...args)
                    : this.getValidator(name)(args.splice(0, 1)[0], args);
            } catch (e) {
                throw new ValidationError(e.message, name, value);
            }

            await Promise.resolve(validator)
                .then(result => {
                    if (result instanceof Error) {
                        throw result;
                    }
                    results[name] = result;
                })
                .catch(e => {
                    throw new ValidationError(e.message, name, value);
                });
        }

        return results;
    }

    /**
     * Insert dynamic values into validator arguments
     *
     * @param args
     * @param formInputs
     */
    parseArgs(args: Array<mixed>, formInputs: Object) {
        _.each(args, (value, index) => {
            if (value.indexOf("@") === 0) {
                const inputName = _.trimStart(value, "@");
                args[index] = formInputs[inputName].props.value;
            }
        });
    }
}

export default new Validation();
