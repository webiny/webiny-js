// @flow
import _ from "lodash";
import { ModelError, Attribute } from "webiny-model";
import EntityCollection from "./../entityCollection";
import Entity from "./../entity";
import EntitiesAttributeValue from "./entitiesAttributeValue";
import EntityAttributesContainer from "../entityAttributesContainer";
import type EntityModel from "./../entityModel";

class EntitiesAttribute extends Attribute {
    auto: { save: boolean, delete: boolean };
    classes: {
        parent: string,
        entities: { class: Class<Entity>, attribute: string },
        using: { class: ?Class<Entity> | Function, attribute: ?string }
    };
    parentEntity: Entity;
    constructor(
        name: string,
        attributesContainer: EntityAttributesContainer,
        entity: Class<Entity>,
        attributeName: string = ""
    ) {
        super(name, attributesContainer);

        const parentModel = ((this.getParentModel(): any): EntityModel);
        this.parentEntity = parentModel.getParentEntity();

        this.classes = {
            parent: this.parentEntity.constructor.name,
            entities: { class: entity, attribute: attributeName },
            using: { class: null, attribute: null }
        };

        // We will use the same value here to (when loading entities without a middle aggregation entity).
        if (!this.classes.entities.attribute) {
            this.classes.entities.attribute = _.camelCase(this.classes.parent);
        }

        /**
         * By default, we don't want to have links stored in entity attribute directly.
         * @var bool
         */
        this.toStorage = false;

        /**
         * Auto save and delete are both enabled by default.
         * @type {{save: boolean, delete: boolean}}
         */
        this.auto = { save: true, delete: true };

        this.parentEntity.on("__save", async () => {
            if (this.getDynamic()) {
                return;
            }

            const value: EntitiesAttributeValue = (this.value: any);

            // If loading is in progress, wait until loaded.
            const mustManage = value.isDirty() || value.isLoading();
            if (!mustManage) {
                return;
            }

            await value.load();

            await this.normalizeSetValues();

            if (this.getUsingClass()) {
                // Do we have to manage entities?
                // If so, this will ensure that newly set or unset entities and its link entities are synced.
                // "syncCurrentEntitiesAndLinks" method must be called on this event because link entities must be ready
                // before the validation of data happens. When validation happens and when link class is set,
                // validation is triggered on link (aggregation) entity, not on entity end (linked) entity.
                await value.manageCurrentLinks();
            } else {
                await value.manageCurrent();
            }
        });

        /**
         * Same as in EntityAttribute, entities present here were already validated when parent entity called the validate method.
         * At this point, entities are ready to be saved (only loaded entities).
         */
        this.parentEntity.on("__afterSave", async () => {
            if (this.getDynamic()) {
                return;
            }

            // We don't have to do the following check here:
            // this.value.isLoading() && (await this.value.load());

            const value: EntitiesAttributeValue = (this.value: any);

            // ...it was already made in the 'save' handler above. Now we only check if not loaded.
            if (!value.isLoaded() || value.isClean()) {
                return;
            }

            if (this.getAutoSave()) {
                // If we are using a link class, we only need to save links, and child entities will be automatically
                // saved if they were loaded.
                if (this.getUsingClass()) {
                    const entities = value.getCurrentLinks();
                    for (let i = 0; i < entities.length; i++) {
                        const current = ((entities[i]: any): Entity);
                        await current.save({ validation: false });
                    }
                } else {
                    const entities = value.getCurrent();
                    for (let i = 0; i < entities.length; i++) {
                        const current = ((entities[i]: any): Entity);
                        await current.save({ validation: false });
                    }
                }

                if (this.getAutoDelete()) {
                    this.getUsingClass()
                        ? await value.deleteInitialLinks()
                        : await value.deleteInitial();
                }
            }

            // Set current entities as new initial values.
            value.syncInitial();
            if (this.getUsingClass()) {
                value.syncInitialLinks();
            }
        });

        this.parentEntity.on("delete", async () => {
            if (this.getDynamic()) {
                return;
            }

            const value: EntitiesAttributeValue = (this.value: any);

            if (this.getAutoDelete()) {
                await value.load();
                const entities = {
                    current: this.getUsingClass() ? value.getCurrentLinks() : value.getCurrent(),
                    class: this.getUsingClass() || this.getEntitiesClass()
                };
                for (let i = 0; i < entities.current.length; i++) {
                    if (entities.current[i] instanceof entities.class) {
                        await entities.current[i].emit("delete");
                    }
                }
            }
        });

        this.parentEntity.on("beforeDelete", async () => {
            if (this.getDynamic()) {
                return;
            }

            const value: EntitiesAttributeValue = (this.value: any);

            if (this.getAutoDelete()) {
                await value.load();
                const entities = {
                    current: this.getUsingClass() ? value.getCurrentLinks() : value.getCurrent(),
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
        let entitiesClass = this.classes.using.class;
        if (!entitiesClass) {
            return null;
        }

        if (entitiesClass.name) {
            return entitiesClass;
        }

        /*:: entitiesClass: Function; */
        if (typeof entitiesClass === "function") {
            // $FlowFixMe
            return entitiesClass();
        }
    }

    getEntitiesAttribute(): ?string {
        return this.classes.entities.attribute;
    }

    getUsingAttribute(): ?string {
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

    /**
     * Loads current entity if needed and returns it.
     * @returns {Promise<void>}
     */
    async getValue(): Promise<mixed> {
        if (typeof this.dynamic === "function") {
            return this.dynamic(...arguments);
        }

        const value = ((this.value: any): EntitiesAttributeValue);
        if (value.isClean()) {
            await value.load();
        }

        await this.normalizeSetValues();

        return value.getCurrent();
    }

    /**
     * Only allowing EntityCollection or plain arrays
     * @param value
     * @returns {Promise<void>}
     */
    setValue(value: mixed): void {
        if (!this.canSetValue()) {
            return;
        }

        const finalValue = this.onSetCallback(value);
        this.value.setCurrent(finalValue, {
            skipDifferenceCheck: true,
            forceSetAsDirty: true
        });
    }

    /**
     * Validates current value - if it's not an instance of EntityCollection, an error will be thrown.
     */
    async validateType(value: mixed) {
        if (Array.isArray(value)) {
            return;
        }
        this.expected("instance of Array or EntityCollection", typeof value);
    }

    async getValidationValue(): Promise<EntityCollection> {
        await this.normalizeSetValues();
        const value = ((this.value: any): EntitiesAttributeValue);
        return this.getUsingClass() ? value.getCurrentLinks() : value.getCurrent();
    }

    async validateValue(value: mixed) {
        const errors = [];
        const correctClass = this.getUsingClass() || this.getEntitiesClass();

        if (!Array.isArray(value)) {
            return;
        }

        for (let i = 0; i < value.length; i++) {
            const currentEntity = value[i];
            if (!(currentEntity instanceof correctClass)) {
                errors.push({
                    code: ModelError.INVALID_ATTRIBUTE,
                    data: {
                        index: i
                    },
                    message: `Validation failed, item at index ${i} not an instance of correct Entity class.`
                });
                continue;
            }

            try {
                await currentEntity.validate();
            } catch (e) {
                errors.push({
                    code: e.code,
                    data: { index: i, ...e.data },
                    message: e.message
                });
            }
        }

        if (!_.isEmpty(errors)) {
            throw new ModelError("Validation failed.", ModelError.INVALID_ATTRIBUTE, errors);
        }
    }

    /**
     * Validates on attribute level and then on entity level (its attributes recursively).
     * If attribute has validators, we must unfortunately always load the attribute value. For example, if we had a 'required'
     * validator, and entity not loaded, we cannot know if there is a value or not, and thus if the validator should fail.
     * @returns {Promise<void>}
     */
    async validate() {
        const valueInstance = ((this.value: any): EntitiesAttributeValue);

        // If attribute has validators or loading is in progress, wait until loaded.
        const mustValidate =
            valueInstance.isDirty() || this.hasValidators() || valueInstance.isLoading();
        if (!mustValidate) {
            return;
        }

        await valueInstance.load();

        const value = await this.getValidationValue();
        const valueValidation = !Attribute.isEmptyValue(value);

        valueValidation && (await this.validateType(value));
        await this.validateAttribute(value);
        valueValidation && (await this.validateValue(value));
    }

    async getJSONValue(): Promise<?Array<mixed>> {
        const value: EntityCollection = await (this.getValue(): any);
        if (value instanceof EntityCollection) {
            return value.toJSON();
        }
        return null;
    }

    async normalizeSetValues() {
        // Before returning, let's load all values.
        const entities = this.value.getCurrent();

        if (!Array.isArray(entities)) {
            return;
        }

        for (let i = 0; i < entities.length; i++) {
            let current = entities[i];

            // "Instance of Entity" check is enough at this point.
            if (current instanceof Entity) {
                continue;
            }

            const entityClass = this.getEntitiesClass();
            if (!entityClass) {
                continue;
            }

            const id = _.get(current, "id", current);
            if (this.parentEntity.isId(id)) {
                const entity = await entityClass.findById(id);
                if (entity) {
                    // If we initially had object with other data set, we must populate entity with it, otherwise
                    // just set loaded entity (because only an ID was received, without additional data).
                    if (current instanceof Object) {
                        entity.populate(current);
                    }
                    entities[i] = entity;
                }
                continue;
            }

            if (current instanceof Object) {
                entities[i] = new entityClass().populate(current);
            }
        }
    }
}

export default EntitiesAttribute;
