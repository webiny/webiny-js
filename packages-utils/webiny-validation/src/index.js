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

	validate(value, validators, options = {}) {
		if (_.isString(validators)) {
			validators = this.parseValidateProperty(validators);
		}

		if (!validators) {
			return;
		}

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

	__validateSync(value, validators, options = {}) {
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