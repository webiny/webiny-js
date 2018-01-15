class AttributeValue {
	constructor(attribute) {
		this.attribute = attribute;
		this.current = null;
		this.dirty = false;
		this.set = false;

		return new Proxy(this, {
			set: (instance, key, value) => {
				if (key === 'current') {
					instance.set = true;
					if (instance.isDifferentFrom(value)) {
						instance.dirty = true;
					}
				}
				instance[key] = value;
				return true;
			}
		});
	}

	setCurrent(value) {
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