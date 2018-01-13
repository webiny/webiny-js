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
		this.value = new EntityAttributeValue();

		this.entityClass = entity;
		this.autoSave = true;


		this.getParentModel().getParentEntity().on('afterSave', async () => {
			if (this.getAutoSave()) {
				for (let i = 0; i < await this.getValue().length; i++) {
					const value = this.value.current[i];
					// Let's only save loaded item.
					if (value instanceof this.getEntityClass()) {
						await value.save();
					}
				}
			}
		});
	}

	setAutoSave(autoSave = true) {
		this.autoSave = autoSave;
		return this;
	}

	getAutoSave() {
		return this.autoSave;
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