class AttributeValue {
	constructor(attribute) {
		this.attribute = attribute;
		this.previous = null;
		this.current = null;
		this.dirty = false;
		this.set = false;
	}

	setCurrent(value) {
		this.set = true;
		this.previous = this.current;
		if (this.isDifferentFrom(value)) {
			this.dirty = true;
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