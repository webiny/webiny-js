const {AttributeValue} = require('webiny-model');
import _ from 'lodash';

class EntityAttributeValue extends AttributeValue {
	constructor(attribute) {
		super(attribute);
		this.loading = false;
		this.queue = [];

		// Contains initial value received upon loading from storage. If the current value becomes different from initial,
		// upon save, old entity must be removed. This is only active when auto delete option on the attribute is enabled,
		// which then represents a one to one relationship.
		this.initial = null;
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

		this.loading = true;

		// Only if we have a valid ID set, we must load linked entity.
		if (this.attribute.getParentModel().getParentEntity().isId(this.current)) {
			this.current = await this.attribute.classes.entity.class.findById(this.current);
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

	isDifferentFrom(value) {
		return _.get(this.current, 'id', this.current) !== _.get(value, 'id', value);
	}

	setInitial(value) {
		this.initial = value;
		return this;
	}

	getInitial() {
		return this.initial;
	}

	currentIsDifferentFromInitial() {
		return this.isDifferentFrom(this.initial);
	}

	async deleteInitial() {
		if (this.currentIsDifferentFromInitial() && this.initial) {
			const initial = await this.attribute.classes.entity.class.findById(this.initial);
			initial && await initial.delete();
			this.setInitial(this.getCurrent())
		}
	}

	/**
	 * Value cannot be set as clean if there is no ID present.
	 * @returns {EntityAttributeValue}
	 */
	clean() {
		if (_.get(this.current, 'id')) {
			return super.clean();
		}

		return this;
	}
}

module.exports = EntityAttributeValue;