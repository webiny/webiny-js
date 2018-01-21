import { ModelError, Attribute } from "webiny-model";
import EntityCollection from "./../entityCollection";
import _ from "lodash";
import EntitiesAttributeValue from "./entitiesAttributeValue";
import Entity from "./../entity";

class EntitiesAttribute extends Attribute {
    constructor(name, attributesContainer, entity, attributeName = null) {
        super(name, attributesContainer);

        this.classes = {
            parent: this.getParentModel().getParentEntity().constructor.name,
            entities: { class: entity, attribute: attributeName },
            using: { class: null, attribute: null }
        };

        // By default, we will be using a camel case version of parent entity's class name.
        this.classes.using.attribute = _.camelCase(this.classes.parent);

        // We will use the same value here to (when loading entities without a middle aggregation entity).
        if (!this.classes.entities.attribute) {
            this.classes.entities.attribute = this.classes.using.attribute;
        }

        /**
         * Attribute's current value.
         * @type {undefined}
         */
        this.value = new EntitiesAttributeValue(this);

        this.autoSave = true;

        /**
         * By default, we don't want to have links stored in entity attribute directly.
         * @var bool
         */
        this.toStorage = false;

        this.getParentModel()
            .getParentEntity()
            .on("afterSave", async () => {
                if (this.getAutoSave() && (this.value.isLoading() || this.value.isSet())) {
                    const entities = await this.getValue();
                    for (let i = 0; i < entities.length; i++) {
                        // Let's only save loaded item.
                        if (entities[i] instanceof this.getEntitiesClass()) {
                            await entities[i].save();
                        }
                    }
                }
            });
    }

    getEntitiesClass() {
        return this.classes.entities.class;
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

    async getValue() {
        return this.value.load();
    }

    /**
     * Only allowing EntityCollection or plain arrays
     * @param value
     * @returns {Promise<void>}
     */
    setValue(value) {
        this.value.load(() => {
            if (!this.canSetValue()) {
                return;
            }

            // Even if the value is invalid (eg. a string), we allow it here, but calling validate() will fail.
            if (value instanceof EntityCollection) {
                this.value.setCurrent(value);
                return;
            }

            if (_.isArray(value)) {
                const collection = new EntityCollection();
                for (let i = 0; i < value.length; i++) {
                    const current = value[i];

                    switch (true) {
                        case current instanceof Entity:
                            collection.push(current);
                            break;
                        case _.isObject(current):
                            collection.push(new this.classes.entities.class().populate(current));
                            break;
                        default:
                            collection.push(current);
                    }
                }

                this.value.setCurrent(collection);
                return;
            }

            this.value.setCurrent(value);
        });
    }

    /**
     * Will not get triggered if setToStorage is set to false, that's why we don't have to do any additional checks here.
     * It will return only valid IDs, other values will be ignored because they must not enter storage.
     * @returns {Promise<*>}
     */
    async getStorageValue() {
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

    hasValue() {
        return !_.isEmpty(this.value.getCurrent());
    }

    async validate() {
        if (this.isEmpty()) {
            return;
        }

        if (!_.isArray(this.value.getCurrent())) {
            this.expected("array", typeof this.value.getCurrent());
        }

        const errors = [];
        for (let i = 0; i < this.value.getCurrent().length; i++) {
            if (!(this.value.getCurrent()[i] instanceof Entity)) {
                continue;
            }

            if (!(this.value.getCurrent()[i] instanceof this.getEntitiesClass())) {
                errors.push({
                    type: ModelError.INVALID_ATTRIBUTE,
                    data: {
                        index: i
                    },
                    message: `Validation failed, item at index ${i} not an instance of correct Entity class.`
                });
            }

            try {
                await this.value.getCurrent()[i].validate();
            } catch (e) {
                errors.push({
                    type: e.getType(),
                    data: { index: i, ...e.getData() },
                    message: e.getMessage()
                });
            }
        }

        if (!_.isEmpty(errors)) {
            throw new ModelError("Validation failed.", ModelError.INVALID_ATTRIBUTE, {
                items: errors
            });
        }
    }
}

export default EntitiesAttribute;
