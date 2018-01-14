const {Attribute} = require('webiny-model');
const _ = require('lodash');
const EntityAttributeValue = require('./entityAttributeValue');

class EntityAttribute extends Attribute {
	constructor(name, attributesContainer, entity) {
		super(name, attributesContainer);

		/**
		 * Attribute's current value.
		 * @type {undefined}
		 */
		this.value = new EntityAttributeValue(this);

		this.entityClass = entity;
		this.auto = {save: true, delete: true};

		this.getParentModel().getParentEntity().on('afterSave', () => {
			if (this.getAutoSave() && this.value.current instanceof this.getEntityClass()) {
				return this.value.current.save();
			}
		});

		/**
		 * This will recursively trigger the same listener on all child entity attributes. Before each delete,
		 * canDelete callback will be called and stop the delete process if an Error is thrown.
		 */
		this.getParentModel().getParentEntity().on('beforeDelete', async () => {
			if (this.getAutoDelete()) {
				const entity = await this.getValue();
				if (entity instanceof this.getEntityClass()) {
					await entity.delete();
				}
			}
		});
	}

	setAutoSave(autoSave = true) {
		this.auto.save = autoSave;
		return this;
	}

	getAutoSave() {
		return this.auto.save;
	}

	setAutoDelete(autoDelete = true) {
		this.auto.delete = autoDelete;
		return this;
	}
	
	getAutoDelete() {
		return this.auto.delete;
	}

	getEntityClass() {
		return this.entityClass;
	}

	setValue(value) {
		if (!this.canSetValue()) {
			return this;
		}

		const {Entity} = require('./..');

		switch (true) {
			case value instanceof Entity:
				this.value.current = value;
				break;
			case _.isObject(value):
				this.value.current = new this.entityClass().populate(value);
				break;
			default:
				this.value.current = value;
		}

		this.value.set = true;

		return this;
	}

	async getValue() {
		if (this.isEmpty()) {
			return null;
		}

		const {Entity} = require('./..');
		if (this.value.current instanceof Entity) {
			return this.value.current;
		}

		return this.getEntityClass().findById(this.value.current);
	}

	async getStorageValue() {
		const {Entity} = require('./..');
		// Not using getValue method because it would load the entity without need.
		if (this.value.current instanceof Entity) {
			return this.value.current.id;
		}
		return this.value.current;
	}

	async getJSONValue() {
		const value = await this.getValue();
		return value instanceof this.getEntityClass() ? value.toJSON() : value;
	}

	async validate() {
		if (this.isSet()) {
			if (!(this.value.current instanceof this.getEntityClass())) {
				this.expected('instance of Entity class', typeof this.value.current);
			}
			await this.value.current.validate();
		}

		return Attribute.prototype.validate.call(this);
	}
}

module.exports = EntityAttribute;