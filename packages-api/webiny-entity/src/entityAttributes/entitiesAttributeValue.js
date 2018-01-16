const {AttributeValue} = require('webiny-model');
const _ = require('lodash');

class EntitiesAttributeValue extends AttributeValue {
	constructor(attribute) {
		super(attribute);

		const {EntityCollection} = require('webiny-entity');
		this.current = new EntityCollection();
		this.set = false;

		this.status = {
			loading: false,
			loaded: false
		};

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

		this.status.loading = true;

		if (this.attribute.getParentModel().getParentEntity().isExisting()) {
			if (this.attribute.getToStorage()) {
				if (classes.using.class) {
					// TODO: finish this.
					this.current = await classes.using.class.findByIds(this.current);
				} else {
					this.current = await classes.entities.class.findByIds(this.current);
				}
			} else {
				let id = await this.attribute.getParentModel().getAttribute('id').getStorageValue();
				if (classes.using.class) {
					this.current = await classes.using.class.find({query: {[classes.using.attribute]: id}});
				} else {
					this.current = await classes.entities.class.find({query: {[classes.entities.attribute]: id}});
				}
			}
		}

		_.isFunction(callback) && await callback();

		this.status.loading = false;
		this.status.loaded = true;

		if (this.queue.length) {
			for (let i = 0; i < this.queue.length; i++) {
				await this.queue[i]();
			}
			this.queue = [];
		}

		return this.current;
	}

	isLoaded() {
		return this.status.loaded;
	}

	isLoading() {
		return this.status.loading;
	}

	/**
	 * Value cannot be set as clean if ID is missing in one of the entities.
	 * @returns {EntityAttributeValue}
	 */
	clean() {
		const entities = this.current || [];
		for (let i = 0; i < entities.length; i++) {
			const {Entity} = require('./..');
			if (entities[i] instanceof Entity) {
				if (!entities[i].id) {
					return this;
				}
			}
		}

		return super.clean();
	}
}

module.exports = EntitiesAttributeValue;