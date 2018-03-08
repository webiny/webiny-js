// @flow
import _ from "lodash";
import { ModelError, Attribute } from "webiny-model";
import EntityCollection from "./../entityCollection";
import Entity from "./../entity";
import EntitiesAttributeValue from "./entitiesAttributeValue";
import EntityAttributesContainer from "../entityAttributesContainer";

class EntitiesAttribute extends Attribute {
    value: EntitiesAttributeValue;

    constructor(
        name: string,
        attributesContainer: EntityAttributesContainer,
        entity: Class<Entity>,
        attributeName: ?string
    ) {
        super(name, attributesContainer, entity);

        // This attribute is async because we need to load entities both on set and get calls.
        this.async = true;

        this.classes = {
            parent: this.getParentModel().getParentEntity().constructor.name,
            entities: { class: entity, attribute: attributeName },
            using: { class: null, attribute: null }
        };

        // We will use the same value here to (when loading entities without a middle aggregation entity).
        if (!this.classes.entities.attribute) {
            this.classes.entities.attribute = _.camelCase(this.classes.parent);
        }

        /**
         * Auto save and delete are both enabled by default.
         * @type {{save: boolean, delete: boolean}}
         */
        this.auto = { save: true, delete: true };

        /**
         * By default, we don't want to have links stored in entity attribute directly.
         * @var bool
         */
        this.toStorage = false;

        this.getParentModel()
            .getParentEntity()
            .on("save", async () => {
                // If loading is in progress, wait until loaded.
                this.value.isLoading() && (await this.value.load());

                if (!this.value.isLoaded()) {
                    return;
                }

                if (this.getUsingClass()) {
                    // Do we have to manage entities?
                    // If so, this will ensure that newly set or unset entities and its link entities are synced.
                    // "syncCurrentEntitiesAndLinks" method must be called on this event because link entities must be ready
                    // before the validation of data happens. When validation happens and when link class is set,
                    // validation is triggered on link (aggregation) entity, not on entity end (linked) entity.
                    await this.value.manageCurrentLinks();
                } else {
                    await this.value.manageCurrent();
                }
            });

        /**
         * Same as in EntityAttribute, entities present here were already validated when parent entity called the validate method.
         * At this point, entities are ready to be saved (only loaded entities).
         */
        this.getParentModel()
            .getParentEntity()
            .on("afterSave", async () => {
                // We don't have to do the following check here:
                // this.value.isLoading() && (await this.value.load());

                // ...it was already made in the 'save' handler above. Now we only check if not loaded.
                if (!this.value.isLoaded()) {
                    return;
                }

                if (this.getAutoSave()) {
                    // If we are using an link class, we only need to save links, and child entities will be automatically
                    // saved if they were loaded.
                    if (this.getUsingClass()) {
                        const entities = this.value.getCurrentLinks();
                        for (let i = 0; i < entities.length; i++) {
                            await entities[i].save({ validation: false });
                        }
                    } else {
                        const entities = await this.value.getCurrent();
                        for (let i = 0; i < entities.length; i++) {
                            await entities[i].save({ validation: false });
                        }
                    }

                    if (this.getAutoDelete()) {
                        this.getUsingClass()
                            ? await this.value.deleteInitialLinks()
                            : await this.value.deleteInitial();
                    }
                }

                // Set current entities as new initial values.
                this.value.syncInitial();
                if (this.getUsingClass()) {
                    this.value.syncInitialLinks();
                }
            });

        this.getParentModel()
            .getParentEntity()
            .on("delete", async () => {
                if (this.getAutoDelete()) {
                    await this.value.load();
                    const entities = {
                        current: this.getUsingClass()
                            ? this.value.getCurrentLinks()
                            : this.value.getCurrent(),
                        class: this.getUsingClass() || this.getEntitiesClass()
                    };
                    for (let i = 0; i < entities.current.length; i++) {
                        if (entities.current[i] instanceof entities.class) {
                            await entities.current[i].emit("delete");
                        }
                    }
                }
            });

        this.getParentModel()
            .getParentEntity()
            .on("beforeDelete", async () => {
                if (this.getAutoDelete()) {
                    await this.value.load();
                    const entities = {
                        current: this.getUsingClass()
                            ? this.value.getCurrentLinks()
                            : this.value.getCurrent(),
                        class: this.getUsingClass() || this.getEntitiesClass()
                    };

                    for (let i = 0; i < entities.current.length; i++) {
                        if (entities.current[i] instanceof entities.class) {
                            await entities.current[i].delete({ events: { delete: false } });
                        }
                    }
                }
            });
    }

    /**
     * Returns AttributeValue class to be used on construct.
     * @returns {AttributeValue}
     */
    getAttributeValueClass() {
        return EntitiesAttributeValue;
    }

    getEntitiesClass(): ?Class<Entity> {
        return this.classes.entities.class;
    }

    getUsingClass(): ?Class<Entity> {
        const entitiesClass = this.classes.using.class;
        if (!entitiesClass) {
            return null;
        }

        if (entitiesClass.name) {
            return entitiesClass;
        }

        return entitiesClass();
    }

    getEntitiesAttribute(): string {
        return this.classes.entities.attribute;
    }

    getUsingAttribute(): string {
        return this.classes.using.attribute;
    }

    setUsing(entityClass: Class<Entity>, entityAttribute: ?string) {
        this.classes.using.class = entityClass;
        if (typeof entityAttribute === "undefined") {
            this.classes.using.attribute = _.camelCase(this.classes.entities.class.name);
        } else {
            this.classes.using.attribute = entityAttribute;
        }

        return this;
    }

    /**
     * Should linked entities be automatically saved once parent entity is saved? By default, linked entities will be automatically saved,
     * before main entity was saved. Can be disabled, although not recommended since manual saving needs to be done in that case.
     * @param autoSave
     * @returns {EntityAttribute}
     */
    setAutoSave(autoSave: boolean = true) {
        this.auto.save = autoSave;
        return this;
    }

    /**
     * Returns true if auto save is enabled, otherwise false.
     * @returns {boolean}
     */
    getAutoSave(): boolean {
        return this.auto.save;
    }

    /**
     * Should linked entity be automatically deleted once parent entity is deleted? By default, linked entities will be automatically
     * deleted, before main entity was deleted. Can be disabled, although not recommended since manual deletion needs to be done in that case.
     * @param autoDelete
     * @returns {EntityAttribute}
     */
    setAutoDelete(autoDelete: boolean = true) {
        this.auto.delete = autoDelete;
        return this;
    }

    /**
     * Returns true if auto delete is enabled, otherwise false.
     * @returns {boolean}
     */
    getAutoDelete(): boolean {
        return this.auto.delete;
    }

    async getValue(): Promise<EntityCollection> {
        return this.value.load();
    }

    /**
     * Only allowing EntityCollection or plain arrays
     * @param value
     * @returns {Promise<void>}
     */
    setValue(value: Array<{}> | EntityCollection): Promise<void> {
        return new Promise((resolve, reject) => {
            this.value.load(async () => {
                if (!this.canSetValue()) {
                    resolve();
                    return;
                }

                const finalValue = await this.onSetCallback(value);

                // Even if the value is invalid (eg. a string), we allow it here, but calling validate() will fail.
                if (finalValue instanceof EntityCollection) {
                    this.value.setCurrent(finalValue);
                    resolve();
                    return;
                }

                try {
                    if (Array.isArray(finalValue)) {
                        const collection = new EntityCollection();
                        for (let i = 0; i < finalValue.length; i++) {
                            const current = finalValue[i];

                            switch (true) {
                                case current instanceof Entity:
                                    collection.push(current);
                                    break;
                                case _.isObject(current):
                                    collection.push(
                                        new this.classes.entities.class().populate(current)
                                    );
                                    break;
                                default:
                                    collection.push(current);
                            }
                        }

                        this.value.setCurrent(collection);
                        resolve();
                        return;
                    }

                    this.value.setCurrent(finalValue);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    /**
     * Will not get triggered if setToStorage is set to false, that's why we don't have to do any additional checks here.
     * It will return only valid IDs, other values will be ignored because they must not enter storage.
     * @returns {Promise<*>}
     */
    async getStorageValue(): Promise<mixed> {
        if (_.isArray(this.value.getCurrent())) {
            // Not using getValue method because it would load the entity without need.
            const storageValue = [];
            for (let i = 0; i < this.value.getCurrent().length; i++) {
                const value = this.value.getCurrent()[i];
                if (value instanceof this.getEntitiesClass()) {
                    storageValue.push(value.id);
                    continue;
                }

                this.getParentModel()
                    .getParentEntity()
                    .isId(value) && storageValue.push(value);
            }

            return storageValue;
        }

        return [];
    }

    /**
     * Validates current value - if it's not an instance of EntityCollection, an error will be thrown.
     */
    async validateType(value: mixed) {
        if (value instanceof EntityCollection) {
            return;
        }
        this.expected("instance of EntityCollection", typeof value);
    }

    async validateValue() {
        const errors = [];
        const entitiesToValidate = this.getUsingClass()
            ? this.value.getCurrentLinks()
            : this.value.getCurrent();
        const correctClass = this.getUsingClass() || this.getEntitiesClass();

        for (let i = 0; i < entitiesToValidate.length; i++) {
            if (!(entitiesToValidate[i] instanceof correctClass)) {
                errors.push({
                    type: ModelError.INVALID_ATTRIBUTE,
                    data: {
                        index: i
                    },
                    message: `Validation failed, item at index ${i} not an instance of correct Entity class.`
                });
                continue;
            }

            try {
                await entitiesToValidate[i].validate();
            } catch (e) {
                errors.push({
                    type: e.type,
                    data: { index: i, ...e.data },
                    message: e.message
                });
            }
        }

        if (!_.isEmpty(errors)) {
            throw new ModelError("Validation failed.", ModelError.INVALID_ATTRIBUTE, {
                items: errors
            });
        }
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
    }

    async getJSONValue(): Promise<Array<Object>> {
        const value = await this.getValue();
        if (value instanceof EntityCollection) {
            return value.toJSON();
        }

        return value;
    }
}

export default EntitiesAttribute;
