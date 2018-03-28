"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyModel = require("webiny-model");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _entityAttributeValue = require("./entityAttributeValue");

var _entityAttributeValue2 = _interopRequireDefault(_entityAttributeValue);

var _entityError = require("./../entityError");

var _entityError2 = _interopRequireDefault(_entityError);

var _2 = require("..");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class EntityAttribute extends _webinyModel.Attribute {
    constructor(name, attributesContainer, entity, options = {}) {
        var _this;

        _this = super(name, attributesContainer);

        // This attribute is async because we need to load entities both on set and get calls.
        this.async = true;

        this.options = options;

        this.classes = {
            entity: { class: entity }
        };

        /**
         * Auto save is always enabled, but delete not. This is because users will more often create many to one relationship than
         * one to one. If user wants a strict one to one relationship, then delete flag must be set to true. In other words, it would
         * be correct to say that if auto delete is enabled, we are dealing with one to one relationship.
         * @type {{save: boolean, delete: boolean}}
         */
        this.auto = {
            save: { enabled: true, options: null },
            delete: { enabled: false, options: null }
        };

        /**
         * Before save, let's validate and save linked entity.
         *
         * This ensures that parent entity has a valid ID which can be stored and also that all nested data is valid since
         * validation will be called internally in the save method. Save operations will be executed starting from bottom
         * nested entities, ending with the main parent entity.
         */
        const parentEntity = this.getParentModel().getParentEntity();
        parentEntity.on(
            "beforeSave",
            (0, _asyncToGenerator3.default)(function*() {
                // At this point current value is an instance or is not instance. It cannot be in the 'loading' state, because that was
                // already checked in the validate method - if in that step entity was in 'loading' state, it will be waited before proceeding.
                if (_this.getAutoSave()) {
                    // We don't need to validate here because validate method was called on the parent entity, which caused
                    // the validation of data to be executed recursively on all attribute values.
                    if (_this.value.getCurrent() instanceof _2.Entity) {
                        yield _this.value.getCurrent().save({ validation: false });
                    }

                    // If initially we had a different entity linked, we must delete it.
                    // If initial is empty, that means nothing was ever loaded (attribute was not accessed) and there is nothing to do.
                    // Otherwise, deleteInitial method will internally delete only entities that are not needed anymore.
                    if (_this.getAutoDelete()) {
                        yield _this.value.deleteInitial(_this.auto.delete.options);
                    }
                }

                // Set current entities as new initial values.
                _this.value.syncInitial();
            })
        );

        /**
         * Once parent entity starts the delete process, we must also make the same on all linked entities.
         * The deletes are done on initial storage entities, not on entities stored as current value.
         */
        parentEntity.on(
            "delete",
            (0, _asyncToGenerator3.default)(function*() {
                if (_this.getAutoDelete()) {
                    yield _this.value.load();
                    const entity = _this.value.getInitial();
                    if (entity instanceof _this.getEntityClass()) {
                        yield entity.emit("delete");
                    }
                }
            })
        );

        parentEntity.on(
            "beforeDelete",
            (0, _asyncToGenerator3.default)(function*() {
                if (_this.getAutoDelete()) {
                    yield _this.value.load();
                    const entity = _this.value.getInitial();
                    if (entity instanceof _this.getEntityClass()) {
                        // We don't want to fire the "delete" event because its handlers were already executed by upper 'delete' listener.
                        // That listener ensured that all callbacks that might've had blocked the deleted process were executed.
                        yield entity.delete({ validation: false, events: { delete: false } });
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
        return _entityAttributeValue2.default;
    }

    /**
     * Should linked entity be automatically saved once parent entity is saved? By default, linked entities will be automatically saved,
     * after main entity was saved. Can be disabled, although not recommended since manual saving needs to be done in that case.
     * @param enabled
     * @param options
     * @returns {EntityAttribute}
     */
    setAutoSave(enabled = true, options = null) {
        this.auto.save = { enabled, options };
        return this;
    }

    /**
     * Returns true if auto save is enabled, otherwise false.
     * @returns {boolean}
     */
    getAutoSave() {
        return this.auto.save.enabled;
    }

    /**
     * Should linked entity be automatically deleted once parent entity is deleted? By default, linked entities will be automatically
     * deleted, before main entity was deleted. Can be disabled, although not recommended since manual deletion needs to be done in that case.
     * @param enabled
     * @param options
     * @returns {EntityAttribute}
     */
    setAutoDelete(enabled = true, options = null) {
        this.auto.delete = { enabled, options };
        return this;
    }

    /**
     * Returns true if auto delete is enabled, otherwise false.
     * @returns {boolean}
     */
    getAutoDelete() {
        return this.auto.delete.enabled;
    }

    getEntityClass() {
        if (Array.isArray(this.classes.entity.class)) {
            let classIdAttribute = this.getParentModel().getAttribute(
                this.options.classIdAttribute
            );
            if (classIdAttribute) {
                const classId = classIdAttribute.getValue();
                for (let i = 0; i < this.classes.entity.class.length; i++) {
                    let current = this.classes.entity.class[i];
                    if (current.classId === classId) {
                        return current;
                    }
                }
            }

            return undefined;
        }

        return this.classes.entity.class;
    }

    getClassIdAttribute() {
        return this.getParentModel().getAttribute(this.options.classIdAttribute);
    }

    hasMultipleEntityClasses() {
        return Array.isArray(this.classes.entity.class);
    }

    canAcceptAnyEntityClass() {
        return this.hasMultipleEntityClasses() && this.classes.entity.class.length === 0;
    }

    setEntityClass(entity) {
        this.classes.entity.class = entity;
        return this;
    }

    setValue(value) {
        if (!this.canSetValue()) {
            return;
        }

        const finalValue = this.onSetCallback(value);
        this.value.setCurrent(finalValue);

        // If we are dealing with multiple Entity classes, we must assign received classId into
        // attribute specified by the "classIdAttribute" option (passed on attribute construction).
        const classIdAttribute = this.getClassIdAttribute();
        if (classIdAttribute && this.hasMultipleEntityClasses()) {
            if (finalValue instanceof _2.Entity) {
                return classIdAttribute.setValue(finalValue.classId);
            }
            if (!finalValue) {
                return classIdAttribute.setValue(null);
            }
        }
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

            // "Instance of Entity" check is enough at this point.
            if (_this2.value.getCurrent() instanceof _2.Entity) {
                return _this2.value.getCurrent();
            }

            const entityClass = _this2.getEntityClass();
            if (!entityClass) {
                return _this2.value.getCurrent();
            }

            const id = _lodash2.default.get(
                _this2.value.getCurrent(),
                "id",
                _this2.value.getCurrent()
            );
            if (
                _this2
                    .getParentModel()
                    .getParentEntity()
                    .isId(id)
            ) {
                const entity = yield entityClass.findById(id);
                if (entity) {
                    // If we initially had object with other data set, we must populate entity with it, otherwise
                    // just set loaded entity (because only an ID was received, without additional data).
                    if (_this2.value.getCurrent() instanceof Object) {
                        entity.populate(_this2.value.getCurrent());
                    }
                    _this2.value.setCurrent(entity);
                }
                return _this2.value.getCurrent();
            }

            if (_this2.value.getCurrent() instanceof Object) {
                const entity = new entityClass().populate(_this2.value.getCurrent());
                _this2.value.setCurrent(entity);
            }

            // If valid value was not returned until this point, we return recently set value.
            // The reason is, if the entity is about to be saved, validation must be executed and error must be thrown,
            // warning users that passed value is invalid / entity was not found.
            return _this2.value.getCurrent();
        })();
    }

    /**
     * Returns storage value (entity ID or null).
     * @returns {Promise<*>}
     */
    getStorageValue() {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            // Not using getValue method because it would load the entity without need.
            let current = _this3.value.getCurrent();

            // But still, if the value is loading currently, let's wait for it to load completely, and then use that value.
            if (_this3.value.isLoading()) {
                current = yield _this3.value.load();
            }

            const id = _lodash2.default.get(current, "id", current);
            return _this3
                .getParentModel()
                .getParentEntity()
                .isId(id)
                ? id
                : null;
        })();
    }

    /**
     * Sets value received from storage.
     * @param value
     * @returns {EntityAttribute}
     */
    setStorageValue(value) {
        this.value.setCurrent(value, { skipDifferenceCheck: true });
        this.value.setInitial(value);
        return this;
    }

    getJSONValue() {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const value = yield _this4.getValue();
            if (value instanceof _2.Entity) {
                return yield value.toJSON();
            }
            return value;
        })();
    }

    /**
     * Validates on attribute level and then on entity level (its attributes recursively).
     * If attribute has validators, we must unfortunately always load the attribute value. For example, if we had a 'required'
     * validator, and entity not loaded, we cannot know if there is a value or not, and thus if the validator should fail.
     * @returns {Promise<void>}
     */
    validate() {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            // If attribute is dirty, has validators or loading is in progress, wait until loaded.
            if (_this5.value.isDirty() || _this5.hasValidators() || _this5.value.isLoading()) {
                yield _this5.value.load();
            }

            if (!_this5.value.isLoaded()) {
                return;
            }

            const value = yield _this5.getValidationValue();
            const valueValidation = !_webinyModel.Attribute.isEmptyValue(value);

            if (valueValidation && _this5.hasMultipleEntityClasses()) {
                if (!_this5.options.classIdAttribute) {
                    throw new _webinyModel.ModelError(
                        `Entity attribute "${
                            _this5.name
                        }" accepts multiple Entity classes but does not have "classIdAttribute" option defined.`,
                        _webinyModel.ModelError.INVALID_ATTRIBUTE
                    );
                }

                let classIdAttribute = _this5.getClassIdAttribute();
                if (!classIdAttribute) {
                    throw new _webinyModel.ModelError(
                        `Entity attribute "${
                            _this5.name
                        }" accepts multiple Entity classes but classId attribute is missing.`,
                        _webinyModel.ModelError.INVALID_ATTRIBUTE
                    );
                }

                // We only do class validation if list of classes has been provided. Otherwise, we don't do the check.
                // This is because in certain cases, a list of classes cannot be defined, and in other words, any
                // class of entity can be assigned. One example is the File entity, which has an "ref" attribute, which
                // can actually link to any type of entity.
                if (!_this5.canAcceptAnyEntityClass()) {
                    if (!_this5.getEntityClass()) {
                        throw new _entityError2.default(
                            `Entity attribute "${
                                _this5.name
                            }" accepts multiple Entity classes but it was not found (classId attribute holds value "${classIdAttribute.getValue()}").`,
                            _webinyModel.ModelError.INVALID_ATTRIBUTE
                        );
                    }
                }
            }

            valueValidation && (yield _this5.validateType(value));
            yield _this5.validateAttribute(value);
            valueValidation && (yield _this5.validateValue(value));
        })();
    }

    /**
     * Validates current value - if it's not a valid ID or an instance of Entity class, an error will be thrown.
     */
    validateType(value) {
        var _this6 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_this6.isValidInstance(value)) {
                return;
            }

            _this6.expected("instance of Entity class", typeof value);
        })();
    }

    validateValue(value) {
        return (0, _asyncToGenerator3.default)(function*() {
            // This validates on the entity level.
            value instanceof _2.Entity && (yield value.validate());
        })();
    }

    isValidInstance(instance) {
        if (this.hasMultipleEntityClasses()) {
            return instance instanceof _2.Entity;
        }
        return instance instanceof this.getEntityClass();
    }
}

exports.default = EntityAttribute;
//# sourceMappingURL=entityAttribute.js.map
