const {AttributeValue} = require('webiny-model');
const _ = require('lodash');

class EntityAttributeValue extends AttributeValue {
	constructor(attribute) {
		super(attribute);
		this.loading = false;
		this.queue = [];
	}

	/**
	 * Ensures data is loaded correctly, and in the end returns current value.
	 * @returns {Promise<*>}
	 */
	async load(callback) {
		if (this.isLoaded()) {
			_.isFunction(callback) && await callback();
			return this.current;
		}

		if (this.isLoading()) {
			return new Promise(resolve => {
				this.queue.push(async () => {
					_.isFunction(callback) && await callback();
					resolve(this.current);
				});
			})
		}

		const classes = this.attribute.classes;

		this.loading = true;

		// Only if we have a valid ID set, we must load linked entity.
		if (this.attribute.getParentModel().getParentEntity().isId(this.current)) {
			this.current = await classes.entity.class.findById(this.current);
		}

		_.isFunction(callback) && await callback();

		this.loading = false;

		if (this.queue.length) {
			for (let i = 0; i < this.queue.length; i++) {
				await this.queue[i]();
			}
			this.queue = [];
		}

		return this.current;
	}

	isLoaded() {
		return this.current instanceof this.attribute.classes.entity.class;
	}

	isLoading() {
		return this.loading;
	}

	/**
	 * Value cannot be set as clean if there is no ID present.
	 * @returns {EntityAttributeValue}
	 */
	clean() {
		if (_.get(this.value, 'current.id')) {
			return super.clean();
		}

		return this;
	}
}

module.exports = EntityAttributeValue;