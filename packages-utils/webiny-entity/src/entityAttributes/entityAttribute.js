import { Attribute } from "webiny-model";
import _ from "lodash";
import EntityAttributeValue from "./entityAttributeValue";
import Entity from "./../entity";

class EntityAttribute extends Attribute {
    value: EntityAttributeValue;
    classes: { parent: string, entity: { class: mixed } }; // TODO: class is not mixed.
    auto: { save: boolean, delete: boolean };

    constructor(name, attributesContainer, entity) {
        super(name, attributesContainer);

        this.classes = {
            entity: { class: entity }
        };

        /**
         * Attribute's current value.
         */
        this.value = new EntityAttributeValue(this);

        /**
         * Auto save is always enabled, but delete not. This is because users will more often create many to one relationship than
         * one to one. If user wants a strict one to one relationship, then delete flag must be set to true. In other words, it would
         * be correct to say that if auto delete is enabled, we are dealing with one to one relationship.
         * @type {{save: boolean, delete: boolean}}
         */
        this.auto = { save: true, delete: false };

        /**
         * Before save, let's validate and save linked entity.
         *
         * This ensures that parent entity has a valid ID which can be stored and also that all nested data is valid since
         * validation will be called internally in the save method. Save operations will be executed starting from bottom
         * nested entities, ending with the main parent entity.
         */
        this.getParentModel()
            .getParentEntity()
            .on("beforeSave", async () => {
                // At this point current value is an instance or is not instance. It cannot be in the 'loading' state, because that was
                // already checked in the validate method - if in that step entity was in 'loading' state, it will be waited before proceeding.
                if (
                    this.getAutoSave() &&
                    this.value.getCurrent() instanceof this.getEntityClass()
                ) {
                    // We don't need to validate here because validate method was called on the parent entity, which caused
                    // the validation of data to be executed recursively on all attribute values.
                    await this.value.getCurrent().save({ validation: false });

                    // If initially we had a different entity linked, we must delete it.
                    // If initial is empty, that means nothing was ever loaded (attribute was not accessed) and there is nothing to do.
                    // Otherwise, deleteInitial method will internally delete only entities that are not needed anymore.
                    if (this.getAutoSave() && this.getAutoDelete()) {
                        await this.value.deleteInitial();
                    }
                }

                // Set current entities as new initial values.
                this.value.syncInitial();
            });

        this.getParentModel()
            .getParentEntity()
            .on("delete", async () => {
                if (this.getAutoDelete()) {
                    const entity = await this.getValue();
                    if (entity instanceof this.getEntityClass()) {
                        await entity.emit("delete");
                    }
                }
            });

        this.getParentModel()
            .getParentEntity()
            .on("beforeDelete", async () => {
                if (this.getAutoDelete()) {
                    const entity = await this.getValue();
                    if (entity instanceof this.getEntityClass()) {
                        // We don't want to fire the "delete" event because its handlers were already executed by upper 'delete' listener.
                        // That listener ensured that all callbacks that might've had blocked the deleted process were executed.
                        await entity.delete({ validation: false, events: { delete: false } });
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
        const entityClass = this.classes.entity.class;
        if (entityClass.name) {
            return entityClass;
        }

        return this.classes.entity.class();
    }

    /**
     * Only allowing EntityCollection or plain arrays
     * @param value
     * @returns {Promise<void>}
     */
    setValue(value) {
        return new Promise((resolve, reject) => {
            return this.value.load(() => {
                if (!this.canSetValue()) {
                    resolve();
                    return this;
                }

                try {
                    switch (true) {
                        case value instanceof Entity:
                            this.value.setCurrent(value);
                            break;
                        case _.isObject(value): {
                            let entity = this.getEntityClass();
                            this.value.setCurrent(new entity().populate(value));
                            break;
                        }
                        default:
                            this.value.setCurrent(value);
                    }
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
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
        // Not using getValue method because it would load the entity without need.
        let current = this.value.getCurrent();

        // But still, if the value is loading currently, let's wait for it to load completely, and then use that value.
        if (this.value.isLoading()) {
            current = await this.value.load();
        }

        return current instanceof Entity ? current.id : current;
    }

    /**
     * Sets value received from storage.
     * @param value
     * @returns {EntityAttribute}
     */
    setStorageValue(value): this {
        this.value.setCurrent(value, { skipDifferenceCheck: true });
        return this;
    }

    async getJSONValue(): Promise<mixed> {
        const value = await this.getValue();
        if (value instanceof Entity) {
            return await value.toJSON();
        }
        return value;
    }

    /**
     * Validates current value - if it's not a valid ID or an instance of Entity class, an error will be thrown.
     */
    validateType() {
        if (
            this.getParentModel()
                .getParentEntity()
                .isId(this.value.getCurrent())
        ) {
            return;
        }

        if (this.value.getCurrent() instanceof this.getEntityClass()) {
            return;
        }
        this.expected("instance of Entity class or a valid ID", typeof this.value.getCurrent());
    }

    /**
     * Validates on attribute level and then on entity level (its attributes recursively).
     * If attribute has validators, we must unfortunately always load the attribute value. For example, if we had a 'required'
     * validator, and entity not loaded, we cannot know if there is a value or not, and thus if the validator should fail.
     * @returns {Promise<void>}
     */
    async validate() {
        // If attribute has validators or loading is in progress, wait until loaded.
        if (this.hasValidators() || this.value.isLoading()) {
            await this.value.load();
        }

        if (!this.value.isLoaded()) {
            return;
        }

        // This validates on the attribute level.
        await Attribute.prototype.validate.call(this);

        // This validates on the entity level.
        this.value.getCurrent() instanceof this.getEntityClass() &&
            (await this.value.getCurrent().validate());
    }
}

export default EntityAttribute;
