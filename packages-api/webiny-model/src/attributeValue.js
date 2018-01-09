class AttributeValue {
	constructor() {
		this.current = null;
		this.dirty = false;
		this.set = false;

		return new Proxy(this, {
			set: (instance, key, value) => {
				if (key === 'current') {
					this.set = true;
					if (instance.current !== value) {
						this.dirty = true;
					}
				}
				instance[key] = value;
				return true;
			}
		});
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