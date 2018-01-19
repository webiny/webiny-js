const {Attribute} = require('webiny-model');
import _ from 'lodash';
const EntityAttributeValue = require('./entityAttributeValue');

class EntityAttribute extends Attribute {
	constructor(name, attributesContainer, entity) {
		super(name, attributesContainer);

		this.classes = {
			parent: this.getParentModel().getParentEntity().constructor.name,
			entity: {class: entity}
		};

		/**
		 * Attribute's current value.
		 * @type {undefined}
		 */
		this.value = new EntityAttributeValue(this);

		this.entityClass = entity;

		/**
		 * Auto save is always enabled, but delete not. This is because users will more often create many to one relationship than
		 * one to one. If user wants a strict one to one relationship, then delete flag must be set to true. In other words, it would
		 * be correct to say that if auto delete is enabled, we are dealing with one to one relationship.
		 * @type {{save: boolean, delete: boolean}}
		 */
		this.auto = {save: true, delete: false};

		/**
		 * Before save, let's validate and save linked entity.
		 *
		 * This ensures that parent entity has a valid ID which can be stored and also that all nested data is valid since
		 * validation will be called internally in the save method. Save operations will be executed starting from bottom
		 * nested entities, ending with the main parent entity.
		 */
		this.getParentModel().getParentEntity().on('beforeSave', async () => {
			if (this.getAutoSave() && this.value.getCurrent() instanceof this.getEntityClass()) {
				await this.value.getCurrent().save();

				// If initially we had a different entity linked, we must delete it. The following method will only do deletes if needed.
				await this.value.deleteInitial();
			}
		});

		/**
		 * This will recursively trigger the same listener on all child entity attributes. Before each delete,
		 * canDelete callback will be called and stop the delete process if an Error is thrown.
		 *
		 * Delete operations will be executed starting from bottom nested entities, ending with the main parent entity.
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

	/**
	 * Should linked entity be automatically saved once parent entity is saved? By default, linked entities will be automatically saved,
	 * after main entity was saved. Can be disabled, although not recommended since manual saving needs to be done in that case.
	 * @param autoSave
	 * @returns {EntityAttribute}
	 */
	setAutoSave(autoSave = true) {
		this.auto.save = autoSave;
		return this;
	}

	/**
	 * Returns true if auto save is enabled, otherwise false.
	 * @returns {boolean}
	 */
	getAutoSave() {
		return this.auto.save;
	}

	/**
	 * Should linked entity be automatically deleted once parent entity is deleted? By default, linked entities will be automatically
	 * deleted, before main entity was deleted. Can be disabled, although not recommended since manual deletion needs to be done in that case.
	 * @param autoDelete
	 * @returns {EntityAttribute}
	 */
	setAutoDelete(autoDelete = true) {
		this.auto.delete = autoDelete;
		return this;
	}

	/**
	 * Returns true if auto delete is enabled, otherwise false.
	 * @returns {boolean}
	 */
	getAutoDelete() {
		return this.auto.delete;
	}


	getEntityClass() {
		return this.entityClass;
	}

	/**
	 * Only allowing EntityCollection or plain arrays
	 * @param value
	 * @returns {Promise<void>}
	 */
	setValue(value) {
		this.value.load(() => {
			if (!this.canSetValue()) {
				return this;
			}

			const {Entity} = require('./..');

			switch (true) {
				case value instanceof Entity:
					this.value.setCurrent(value);
					break;
				case _.isObject(value):
					this.value.setCurrent(new this.entityClass().populate(value));
					break;
				default:
					this.value.setCurrent(value);
			}
		});
	}

	/**
	 * Loads current entity if needed and returns it.
	 * @returns {Promise<void>}
	 */
	async getValue() {
		return this.value.load();
	}

	/**
	 * Returns storage value (entity ID or null).
	 * @returns {Promise<*>}
	 */
	async getStorageValue() {
		const {Entity} = require('./..');

		// Not using getValue method because it would load the entity without need.
		let current = this.value.getCurrent();

		// But still, if the value is loading currently, let's wait for it to load completely, and then use that value.
		if (this.value.isLoading()) {
			current = await this.value.load();
		}

		return current instanceof Entity ? current.id : this.value.getCurrent();
	}

	/**
	 * Sets value received from storage.
	 * @param value
	 * @returns {EntityAttribute}
	 */
	setStorageValue(value) {
		this.value.setCurrent(value, {skipDifferenceCheck: true}).setInitial(value);
		return this;
	}

	/**
	 * Returns JSON value.
	 * @returns {Promise<void>}
	 */
	async getJSONValue() {
		const value = await this.getValue();
		return value instanceof this.getEntityClass() ? value.toJSON() : value;
	}

	/**
	 * Validates current value - if it's not a valid ID or an instance of Entity class, an error will be thrown.
	 */
	validateType() {
		if (this.getParentModel().getParentEntity().isId(this.value.getCurrent())) {
			return;
		}
		if (this.value.getCurrent() instanceof this.getEntityClass()) {
			return;
		}
		this.expected('instance of Entity class or a valid ID', typeof this.value.getCurrent());
	}

	/**
	 * Validates on attribute level and then on entity level (its attributes recursively).
	 * @returns {Promise<void>}
	 */
	async validate() {
		// This validates on the attribute level.
		await Attribute.prototype.validate.call(this);

		// This validates on the entity level.
		this.value.getCurrent() instanceof this.getEntityClass() && await this.value.getCurrent().validate();
	}
}

module.exports = EntityAttribute;