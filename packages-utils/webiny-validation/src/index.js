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
		let validate = validators.split(',');

		validators = {};
		validate.forEach(v => {
			let validator = _.trim(v).split(':');
			let vName = validator.shift();
			validators[vName] = validator;
		});
		return validators;
	}

	validate(value, validators, options = {}) {
		if (!validators) {
			return;
		}

		if (!_.isString(validators)) {
			throw new Error('Validators must be specified as a string (eg. required,minLength:10,email).')
		}

		validators = this.parseValidateProperty(validators);

		if (options.async === false) {
			return this.__validateSync(value, validators, options);
		}

		return this.__validateAsync(value, validators, options);
	}

	async __validateAsync(value, validators, options = {}) {
		for (const [name, parameters] of Object.entries(validators)) {
			const validator = this.getValidator(name);
			try {
				await validator(value, parameters);
			} catch (e) {
				if (options.throw === false) {
					return {message: e.message, name, value};
				}
				throw new ValidationError(e.message, name, value);
			}
		}
		return true;
	}

	__validateSync(value, validators, options) {
		for (const [name, parameters] of Object.entries(validators)) {
			const validator = this.getValidator(name);
			try {
				validator(value, parameters);
			} catch (e) {
				if (options.throw === false) {
					return {message: e.message, name, value};
				}
				throw new ValidationError(e.message, name, value);
			}
		}
		return true;
	}
}

const validation = new Validation();

module.exports = {validation, ValidationError};