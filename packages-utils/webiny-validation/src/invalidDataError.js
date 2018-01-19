class InvalidDataError extends Error {
    constructor(message, validator, value = null) {
        super();
        this.message = message;
        this.validator = validator;
        this.value = value;
    }

	/**
	 * Sets the name of validator that resulted with an error.
	 * @param validator
	 */
	setValidator(validator) {
        this.validator = validator;
    }

	/**
	 * Returns the name of validator that resulted with an error.
	 * @returns {*}
	 */
	getValidator() {
		return this.validator;
	}

	/**
	 * Returns validation message.
	 * @returns {string}
	 */
    getMessage() {
        return this.message;
    }

	/**
	 * Sets validation message.
	 * @param message
	 * @returns {ValidationError}
	 */
	setMessage(message) {
		this.message = message;
		return this;
	}

	/**
	 * Returns value that is invalid.
	 * @returns {*}
	 */
    getValue() {
        return this.value;
    }

	/**
	 * Sets invalid value.
	 * @param value
	 * @returns {ValidationError}
	 */
	setValue(value) {
		this.value = value;
		return this;
	}
}

module.exports = InvalidDataError;