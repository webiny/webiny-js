const _ = require('lodash');
const ValidationError = require('./validationError');

class Validation {
    constructor() {
        this.validators = require('./validators');
    }

    setValidator(name, callable) {
        this.validators[name] = callable;
        return this;
    }

    getValidator(name) {
        if (!this.validators[name]) {
            throw new ValidationError('Validator `' + name + '` does not exist!', name);
        }
        return this.validators[name];
    }

    parseValidateProperty(validators) {
        if (!validators) {
            return false;
        }

        let validate = validators;
        if (_.isString(validators)) {
            validate = validators.split(',');
        }

        validators = {};
        validate.forEach(v => {
            let validator = null;
            let vName = null;
            if (_.isString(v)) {
                validator = _.trim(v).split(':');
                vName = validator.shift();
            } else {
                validator = v;
                vName = _.uniqueId('validator');
            }
            validators[vName] = validator;
        });
        return validators;
    }

    async validate(value, validators) {
        if (_.isString(validators)) {
            validators = this.parseValidateProperty(validators);
        }

        if (!validators) {
        	return;
        }

		for (const [name, parameters] of Object.entries(validators)) {
            const validator = this.getValidator(name);
            try {
                await validator(value, parameters);
            } catch (e) {
                throw new ValidationError(e.message, name, value);
            }
		}
    }
}

const validation = new Validation();

module.exports = {validation, ValidationError};