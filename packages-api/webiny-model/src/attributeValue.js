class AttributeValue {
	constructor(attribute) {
		this.attribute = attribute;
		this.current = null;
		this.dirty = false;
		this.set = false;
	}

	setCurrent(value, options = {}) {
		this.set = true;

		if (!options.skipDifferenceCheck) {
			if (this.isDifferentFrom(value)) {
				this.dirty = true;
			}
		}

		this.current = value;
		return this;
	}

	getCurrent() {
		return this.current;
	}

	isDifferentFrom(value) {
		return this.current !== value;
	}

	isDirty() {
		return this.dirty;
	}

	isClean() {
		return !this.isDirty();
	}

	clean() {
		this.dirty = false;
		return this;
	}

	isSet() {
		return this.set;
	}

	reset() {
		this.current = null;
		this.dirty = false;
		this.set = false;
	}
}

module.exports = AttributeValue;