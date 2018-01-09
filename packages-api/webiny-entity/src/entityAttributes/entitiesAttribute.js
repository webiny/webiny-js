const {ModelError, Attribute} = require('webiny-model');
const EntityCollection = require('./../../src/entityCollection');
const _ = require('lodash');
const EntitiesAttributeValue = require('./entitiesAttributeValue');

class EntitiesAttribute extends Attribute {
	constructor(name, attributesContainer, entity, attributeName = null) {
		super(name, attributesContainer);

		/**
		 * Attribute's current value.
		 * @type {undefined}
		 */
		this.value = new EntitiesAttributeValue();

		const defaultAttribute = _.camelCase(this.getParentModel().getParentEntity().classId);
		this.classes = {
			entity: {class: entity, attribute: attributeName || defaultAttribute},
			using: {class: null, attribute: defaultAttribute}
		};

		this.autoSave = false;

		/**
		 * By default, we don't want to have links stored in entity attribute directly.
		 * @var bool
		 */
		this.toStorage = false;

		const parent = this.getParentModel().getParentEntity();
		parent.on('load', async () => {
			if (this.getToStorage()) {
				return;
			}

			let ids = null;
			const id = await this.getParentModel().getAttribute('id').getStorageValue();
			if (this.classes.using.class) {
				ids = await this.classes.using.class.getDriver().findIds(parent, {where: {[this.classes.using.attribute]: id}});
			} else {
				ids = await this.classes.entity.class.getDriver().findIds(parent, {where: {[this.classes.entity.attribute]: id}});
			}

			this.value.current = ids.getResult();
			// We don't want to mark value as dirty.
			this.value.clean();
		}).setOnce();

		parent.on('afterSave', async () => {
			if (this.getAutoSave()) {
				const entities = await this.getValue();
				for (let i = 0; i < entities.length; i++) {
					// Let's only save loaded item.
					if (entities[i] instanceof this.getEntityClass()) {
						await entities[i].save();
					}
				}
			}
		});
	}

	getEntityClass() {
		return this.classes.entity.class;
	}

	getUsingClass() {
		return this.classes.using.class;
	}

	setUsing(entityClass, entityAttribute = null) {
		this.classes.using.class = entityClass;
		this.classes.using.attribute = entityAttribute;
		return this;
	}

	getUsing() {
		return this.classes.using;
	}

	setAutoSave(autoSave = true) {
		this.autoSave = autoSave;
		return this;
	}

	getAutoSave() {
		return this.autoSave;
	}

	setValue(values) {
		if (!this.canSetValue()) {
			return this;
		}

		// Even if the value is invalid (eg. a string), we allow it here, but calling validate() will fail.
		if (!_.isArray(values)) {
			this.value.current = values;
			return this;
		}

		const newValues = [];
		for (let i = 0; i < values.length; i++) {
			const value = values[i];

			const {Entity} = require('./..');

			switch (true) {
				case value instanceof Entity:
					newValues.push(value);
					break;
				case _.isObject(value):
					const newValue = new this.classes.entity.class();
					newValue.populate(value);
					newValues.push(newValue);
					break;
				default:
					newValues.push(value);
			}
		}
		this.value.current = newValues;

		return this;
	}

	async getValue() {
		// This is equivalent to "super.getValue()" method call, which does not work with async methods.
		const value = Attribute.prototype.getValue.call(this);

		if (_.isArray(value)) {
			for (let i = 0; i < value.length; i++) {
				if (value[i] instanceof this.getEntityClass()) {
					// Do nothing.
				} else {
					if (value[i]) {
						value[i] = await this.getEntityClass().findById(value[i]);
					}
				}
			}
		}

		return this.value.current;
	}

	/**
	 * Will not get triggered if setToStorage is set to false, that's why we don't have to do any additional checks here.
	 * @returns {Promise<*>}
	 */
	async getStorageValue() {
		if (_.isArray(this.value.current)) {
			// Not using getValue method because it would load the entity without need.
			const storageValue = [];
			for (let i = 0; i < this.value.current.length; i++) {
				const value = this.value.current[i];
				if (value instanceof this.getEntityClass()) {
					storageValue.push(value.id);
				} else {
					storageValue.push(value);
				}
			}

			return storageValue;
		}

		return [];
	}

	/**
	 * Will not get triggered if setToStorage is set to false, that's why we don't have to do any additional checks here.
	 */
	setStorageValue(value) {
		return super.setStorageValue(new EntityCollection(value));
	}

	async validate() {
		if (this.isEmpty()) {
			return;
		}

		if (!_.isArray(this.value.current)) {
			this.expected('array', typeof this.value.current);
		}

		const errors = [];
		for (let i = 0; i < this.value.current.length; i++) {
			const {Entity} = require('./..');

			if (!(this.value.current[i] instanceof Entity)) {
				continue;
			}

			if (!(this.value.current[i] instanceof this.getEntityClass())) {
				errors.push({
					type: ModelError.INVALID_ATTRIBUTE,
					data: {
						index: i
					},
					message: `Validation failed, item at index ${i} not an instance of correct Entity class.`
				});
			}

			try {
				await this.value.current[i].validate();
			} catch (e) {
				errors.push({
					type: e.getType(),
					data: {index: i, ...e.getData()},
					message: e.getMessage()
				});
			}
		}

		if (!_.isEmpty(errors)) {
			throw new ModelError('Validation failed.', ModelError.INVALID_ATTRIBUTE, {items: errors});
		}
	}
}

module.exports = EntitiesAttribute;