"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _webinyModel = require("webiny-model");

var _entityCollection = require("./../entityCollection");

var _entityCollection2 = _interopRequireDefault(_entityCollection);

var _entity = require("./../entity");

var _entity2 = _interopRequireDefault(_entity);

var _entitiesAttributeValue = require("./entitiesAttributeValue");

var _entitiesAttributeValue2 = _interopRequireDefault(_entitiesAttributeValue);

var _entityAttributesContainer = require("../entityAttributesContainer");

var _entityAttributesContainer2 = _interopRequireDefault(_entityAttributesContainer);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class EntitiesAttribute extends _webinyModel.Attribute {
    constructor(name, attributesContainer, entity, attributeName) {
        var _this;

        _this = super(name, attributesContainer, entity);

        // This attribute is async because we need to load entities both on set and get calls.
        this.async = true;

        this.classes = {
            parent: this.getParentModel().getParentEntity().constructor.name,
            entities: { class: entity, attribute: attributeName },
            using: { class: null, attribute: null }
        };

        // We will use the same value here to (when loading entities without a middle aggregation entity).
        if (!this.classes.entities.attribute) {
            this.classes.entities.attribute = _lodash2.default.camelCase(this.classes.parent);
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

        const parentEntity = this.getParentModel().getParentEntity();

        parentEntity.on(
            "save",
            (0, _asyncToGenerator3.default)(function*() {
                // If loading is in progress, wait until loaded.
                const mustManage = _this.value.isDirty() || _this.value.isLoading();
                if (!mustManage) {
                    return;
                }

                yield _this.value.load();

                yield _this.normalizeSetValues();

                if (_this.getUsingClass()) {
                    // Do we have to manage entities?
                    // If so, this will ensure that newly set or unset entities and its link entities are synced.
                    // "syncCurrentEntitiesAndLinks" method must be called on this event because link entities must be ready
                    // before the validation of data happens. When validation happens and when link class is set,
                    // validation is triggered on link (aggregation) entity, not on entity end (linked) entity.
                    yield _this.value.manageCurrentLinks();
                } else {
                    yield _this.value.manageCurrent();
                }
            })
        );

        /**
         * Same as in EntityAttribute, entities present here were already validated when parent entity called the validate method.
         * At this point, entities are ready to be saved (only loaded entities).
         */
        parentEntity.on(
            "afterSave",
            (0, _asyncToGenerator3.default)(function*() {
                // We don't have to do the following check here:
                // this.value.isLoading() && (await this.value.load());

                // ...it was already made in the 'save' handler above. Now we only check if not loaded.
                if (!_this.value.isLoaded()) {
                    return;
                }

                if (_this.getAutoSave()) {
                    // If we are using an link class, we only need to save links, and child entities will be automatically
                    // saved if they were loaded.
                    if (_this.getUsingClass()) {
                        const entities = _this.value.getCurrentLinks();
                        for (let i = 0; i < entities.length; i++) {
                            const current = entities[i];
                            yield current.save({ validation: false });
                        }
                    } else {
                        const entities = yield _this.value.getCurrent();
                        for (let i = 0; i < entities.length; i++) {
                            yield entities[i].save({ validation: false });
                        }
                    }

                    if (_this.getAutoDelete()) {
                        _this.getUsingClass()
                            ? yield _this.value.deleteInitialLinks()
                            : yield _this.value.deleteInitial();
                    }
                }

                // Set current entities as new initial values.
                _this.value.syncInitial();
                if (_this.getUsingClass()) {
                    _this.value.syncInitialLinks();
                }
            })
        );

        parentEntity.on(
            "delete",
            (0, _asyncToGenerator3.default)(function*() {
                if (_this.getAutoDelete()) {
                    yield _this.value.load();
                    const entities = {
                        current: _this.getUsingClass()
                            ? _this.value.getCurrentLinks()
                            : _this.value.getCurrent(),
                        class: _this.getUsingClass() || _this.getEntitiesClass()
                    };
                    for (let i = 0; i < entities.current.length; i++) {
                        if (entities.current[i] instanceof entities.class) {
                            yield entities.current[i].emit("delete");
                        }
                    }
                }
            })
        );

        parentEntity.on(
            "beforeDelete",
            (0, _asyncToGenerator3.default)(function*() {
                if (_this.getAutoDelete()) {
                    yield _this.value.load();
                    const entities = {
                        current: _this.getUsingClass()
                            ? _this.value.getCurrentLinks()
                            : _this.value.getCurrent(),
                        class: _this.getUsingClass() || _this.getEntitiesClass()
                    };

                    for (let i = 0; i < entities.current.length; i++) {
                        if (entities.current[i] instanceof entities.class) {
                            yield entities.current[i].delete({ events: { delete: false } });
                        }
                    }
                }
            })
        );
    }

    /**
     * Returns AttributeValue class to be used on construct.
     * @returns {AttributeValue}
     */
    getAttributeValueClass() {
        return _entitiesAttributeValue2.default;
    }

    getEntitiesClass() {
        return this.classes.entities.class;
    }

    getUsingClass() {
        const entitiesClass = this.classes.using.class;
        if (!entitiesClass) {
            return null;
        }

        if (entitiesClass.name) {
            return entitiesClass;
        }

        return entitiesClass();
    }

    getEntitiesAttribute() {
        return this.classes.entities.attribute;
    }

    getUsingAttribute() {
        return this.classes.using.attribute;
    }

    setUsing(entityClass, entityAttribute) {
        this.classes.using.class = entityClass;
        if (typeof entityAttribute === "undefined") {
            this.classes.using.attribute = _lodash2.default.camelCase(
                this.classes.entities.class.name
            );
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

    /**
     * Loads current entity if needed and returns it.
     * @returns {Promise<void>}
     */
    getValue() {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_this2.value.isClean()) {
                yield _this2.value.load();
            }

            yield _this2.normalizeSetValues();

            return _this2.value.getCurrent();
        })();
    }

    /**
     * Only allowing EntityCollection or plain arrays
     * @param value
     * @returns {Promise<void>}
     */
    setValue(value) {
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
     * Sets value received from storage.
     * @param value
     * @returns {EntityAttribute}
     */
    setStorageValue(value) {
        if (this.classes.using.class) {
            this.value.setCurrentLinks(value, { skipDifferenceCheck: true });
            this.value.setInitialLinks(value);
        } else {
            this.value.setCurrent(value, { skipDifferenceCheck: true });
            this.value.setInitial(value);
        }
        return this;
    }

    /**
     * Will not get triggered if setToStorage is set to false, that's why we don't have to do any additional checks here.
     * It will return only valid IDs, other values will be ignored because they must not enter storage.
     * @returns {Promise<*>}
     */
    getStorageValue() {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_lodash2.default.isArray(_this3.value.getCurrent())) {
                // Not using getValue method because it would load the entity without need.
                const storageValue = [];
                for (let i = 0; i < _this3.value.getCurrent().length; i++) {
                    const value = _this3.value.getCurrent()[i];
                    const id = _lodash2.default.get(value, "id", value);
                    _this3
                        .getParentModel()
                        .getParentEntity()
                        .isId(id) && storageValue.push(id);
                }

                return storageValue;
            }

            return [];
        })();
    }

    /**
     * Validates current value - if it's not an instance of EntityCollection, an error will be thrown.
     */
    validateType(value) {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (Array.isArray(value)) {
                return;
            }
            _this4.expected("instance of Array or EntityCollection", typeof value);
        })();
    }

    getValidationValue() {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            yield _this5.normalizeSetValues();
            return _this5.getUsingClass()
                ? _this5.value.getCurrentLinks()
                : _this5.value.getCurrent();
        })();
    }

    validateValue(value) {
        var _this6 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const errors = [];
            const correctClass = _this6.getUsingClass() || _this6.getEntitiesClass();

            if (!Array.isArray(value)) {
                return;
            }

            for (let i = 0; i < value.length; i++) {
                const currentEntity = value[i];
                if (!(currentEntity instanceof correctClass)) {
                    errors.push({
                        code: _webinyModel.ModelError.INVALID_ATTRIBUTE,
                        data: {
                            index: i
                        },
                        message: `Validation failed, item at index ${i} not an instance of correct Entity class.`
                    });
                    continue;
                }

                try {
                    yield currentEntity.validate();
                } catch (e) {
                    errors.push({
                        code: e.code,
                        data: (0, _assign2.default)({ index: i }, e.data),
                        message: e.message
                    });
                }
            }

            if (!_lodash2.default.isEmpty(errors)) {
                throw new _webinyModel.ModelError(
                    "Validation failed.",
                    _webinyModel.ModelError.INVALID_ATTRIBUTE,
                    {
                        items: errors
                    }
                );
            }
        })();
    }

    /**
     * Validates on attribute level and then on entity level (its attributes recursively).
     * If attribute has validators, we must unfortunately always load the attribute value. For example, if we had a 'required'
     * validator, and entity not loaded, we cannot know if there is a value or not, and thus if the validator should fail.
     * @returns {Promise<void>}
     */
    validate() {
        var _this7 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            // If attribute has validators or loading is in progress, wait until loaded.
            const mustValidate =
                _this7.value.isDirty() || _this7.hasValidators() || _this7.value.isLoading();
            if (!mustValidate) {
                return;
            }

            yield _this7.value.load();

            const value = yield _this7.getValidationValue();
            const valueValidation = !_webinyModel.Attribute.isEmptyValue(value);

            valueValidation && (yield _this7.validateType(value));
            yield _this7.validateAttribute(value);
            valueValidation && (yield _this7.validateValue(value));
        })();
    }

    getJSONValue() {
        var _this8 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const value = yield _this8.getValue();
            if (value instanceof _entityCollection2.default) {
                return value.toJSON();
            }

            return value;
        })();
    }

    normalizeSetValues() {
        var _this9 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            // Before returning, let's load all values.
            const entities = _this9.value.getCurrent();

            if (!Array.isArray(entities)) {
                return;
            }

            for (let i = 0; i < entities.length; i++) {
                let current = entities[i];

                // "Instance of Entity" check is enough at this point.
                if (current instanceof _entity2.default) {
                    continue;
                }

                const entityClass = _this9.getEntitiesClass();
                if (!entityClass) {
                    continue;
                }

                const id = _lodash2.default.get(current, "id", current);
                if (
                    _this9
                        .getParentModel()
                        .getParentEntity()
                        .isId(id)
                ) {
                    const entity = yield entityClass.findById(id);
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
        })();
    }
}

exports.default = EntitiesAttribute;
//# sourceMappingURL=entitiesAttribute.js.map
