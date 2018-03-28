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

var _driver = require("./driver");

var _driver2 = _interopRequireDefault(_driver);

var _entityPool = require("./entityPool");

var _entityPool2 = _interopRequireDefault(_entityPool);

var _eventHandler = require("./eventHandler");

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _entityCollection = require("./entityCollection");

var _entityCollection2 = _interopRequireDefault(_entityCollection);

var _entityModel = require("./entityModel");

var _entityModel2 = _interopRequireDefault(_entityModel);

var _entityAttributesContainer = require("./entityAttributesContainer");

var _entityAttributesContainer2 = _interopRequireDefault(_entityAttributesContainer);

var _queryResult = require("./queryResult");

var _queryResult2 = _interopRequireDefault(_queryResult);

var _index = require("./index");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Entity {
    constructor() {
        const proxy = new Proxy(this, {
            set: (instance, key, value) => {
                const attr = instance.getModel().getAttribute(key);
                if (attr) {
                    attr.setValue(value);
                    return true;
                }

                instance[key] = value;
                return true;
            },
            get: (instance, key) => {
                if (["classId", "driver"].includes(key)) {
                    return instance.constructor[key];
                }

                const attr = instance.getModel().getAttribute(key);
                if (attr) {
                    return attr.getValue();
                }

                return instance[key];
            }
        });

        const modelClass = this.getDriver().getModelClass();
        if (!modelClass) {
            throw new _index.EntityError(
                "Entity model is missing.",
                _index.EntityError.MODEL_MISSING
            );
        }

        this.model = new modelClass().setParentEntity(proxy);

        this.listeners = {};
        this.existing = false;
        this.processing = null;

        if (_lodash2.default.get(this, "constructor.crud.logs")) {
            this.attr("savedOn").date();
            this.attr("createdOn").date();
            this.attr("updatedOn").date();
        }

        if (_lodash2.default.get(this, "constructor.crud.delete.soft")) {
            this.attr("deleted")
                .boolean()
                .setDefaultValue(false);

            this.on("beforeDelete", () => (proxy.deleted = true));
        }

        this.on("delete", () => {
            if (!proxy.id) {
                throw new _index.EntityError(
                    "Entity cannot be deleted because it was not previously saved.",
                    _index.EntityError.CANNOT_DELETE_NO_ID
                );
            }
        });

        this.getDriver().onEntityConstruct(proxy);

        if (!this.getAttribute("id")) {
            this.attr("id").char();
        }

        return proxy;
    }

    /**
     * Returns instance of entity's model.
     */
    getModel() {
        return this.model;
    }

    /**
     * Returns instance of used driver.
     */
    static getDriver() {
        return this.driver;
    }

    /**
     * Returns instance of used driver.
     */
    getDriver() {
        return this.constructor.driver;
    }

    /**
     * Returns instance of used entity pool.
     */
    static getEntityPool() {
        return this.pool;
    }

    /**
     * Returns instance of used entity pool.
     */
    getEntityPool() {
        return this.constructor.pool;
    }

    /**
     * Sets whether entity is existing or not.
     */
    setExisting(flag = true) {
        this.existing = flag;
        return this;
    }

    /**
     * Returns true if entity exists or in other words, is already saved in storage. Otherwise returns false.
     */
    isExisting() {
        return this.existing;
    }

    /**
     * Creates new attribute with name.
     */
    attr(name) {
        return this.getModel()
            .getAttributesContainer()
            .attr(name);
    }

    /**
     * Returns single attribute by given name.
     */
    getAttribute(name) {
        return this.getModel().getAttribute(name);
    }

    /**
     * Returns all entity's attributes.
     */
    getAttributes() {
        return this.getModel().getAttributes();
    }

    get(path = "", defaultValue) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            return _this.getModel().get(path, defaultValue);
        })();
    }

    set(path, value) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            return _this2.getModel().set(path, value);
        })();
    }

    /**
     * Returns entity's JSON representation.
     */
    toJSON(path) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            return _lodash2.default.merge(
                { id: _this3.getAttribute("id").getValue() },
                yield _this3.getModel().toJSON(path)
            );
        })();
    }

    /**
     * Returns data suitable for storage.
     */
    toStorage() {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            return _this4.getModel().toStorage();
        })();
    }

    /**
     * Validates current entity and throws exception that contains all invalid attributes.
     */
    validate() {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            yield _this5.emit("beforeValidate");
            yield _this5.getModel().validate();
            yield _this5.emit("afterValidate");
        })();
    }

    /**
     * Used to populate entity with given data.
     */
    populate(data) {
        this.getModel().populate(data);
        return this;
    }

    /**
     * Used when populating entity with data from storage.
     * @param data
     */
    populateFromStorage(data) {
        this.getModel().populateFromStorage(data);
        return this;
    }

    /**
     * Returns class name.
     */
    getClassName() {
        return this.constructor.name;
    }

    /**
     * Returns class name.
     */
    static getClassName() {
        return this.name;
    }

    /**
     * Tells us whether a given ID is valid or not.
     * @param id
     * @param params
     */
    isId(id, params = {}) {
        return this.getDriver().isId(this, id, _lodash2.default.cloneDeep(params));
    }

    /**
     * Tells us whether a given ID is valid or not.
     * @param id
     * @param params
     */
    static isId(id, params = {}) {
        return this.getDriver().isId(this, id, _lodash2.default.cloneDeep(params));
    }

    /**
     * Saves current and all linked entities (if autoSave on the attribute was enabled).
     * @param params
     */
    save(params) {
        var _this6 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_this6.processing) {
                return;
            }

            _this6.processing = "save";
            const existing = _this6.isExisting();
            const logs = _lodash2.default.get(_this6, "constructor.crud.logs");

            if (!params) {
                params = {};
            }

            try {
                const events = params.events || {};
                events.save !== false && (yield _this6.emit("save"));

                params.validation !== false && (yield _this6.validate());

                events.beforeSave !== false && (yield _this6.emit("beforeSave"));

                if (existing) {
                    if (logs) {
                        _this6.savedOn = new Date();
                        _this6.updatedOn = new Date();
                    }
                    events.beforeUpdate !== false && (yield _this6.emit("beforeUpdate"));
                } else {
                    if (logs) {
                        _this6.savedOn = new Date();
                        _this6.createdOn = new Date();
                    }
                    events.beforeCreate !== false && (yield _this6.emit("beforeCreate"));
                }

                yield _this6.getDriver().save(_this6, params);
                _this6.setExisting();

                events.afterSave !== false && (yield _this6.emit("afterSave"));
                if (existing) {
                    events.afterUpdate !== false && (yield _this6.emit("afterUpdate"));
                } else {
                    events.afterCreate !== false && (yield _this6.emit("afterCreate"));
                }

                _this6.getModel().clean();

                _this6.getEntityPool().add(_this6);
            } catch (e) {
                throw e;
            } finally {
                _this6.processing = null;
            }
        })();
    }

    /**
     * Deletes current and all linked entities (if autoDelete on the attribute was enabled).
     * @param params
     */
    delete(params) {
        var _this7 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_this7.processing) {
                return;
            }

            _this7.processing = "delete";

            const soft = _lodash2.default.get(_this7, "constructor.crud.delete.soft");

            if (!params) {
                params = {};
            }

            try {
                const events = params.events || {};
                events.delete !== false && (yield _this7.emit("delete"));

                params.validation !== false && (yield _this7.validate());

                events.beforeDelete !== false && (yield _this7.emit("beforeDelete"));

                if (soft && params.permanent !== true) {
                    yield _this7.getDriver().save(_this7, params);
                } else {
                    yield _this7.getDriver().delete(_this7, params);
                }
                events.afterDelete !== false && (yield _this7.emit("afterDelete"));

                _this7.getEntityPool().remove(_this7);
            } catch (e) {
                throw e;
            } finally {
                _this7.processing = null;
            }
        })();
    }

    /**
     * Finds a single entity matched by given ID.
     * @param id
     * @param params
     */
    static findById(id, params) {
        var _this8 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (!id) {
                return null;
            }

            const pooled = _this8.getEntityPool().get(_this8, id);
            if (pooled) {
                return pooled;
            }

            if (!params) {
                params = {};
            }

            const newParams = _lodash2.default.merge(_lodash2.default.cloneDeep(params), {
                query: { id }
            });
            return yield _this8.findOne(newParams);
        })();
    }

    /**
     * Finds one or more entities matched by given IDs.
     * @param ids
     * @param params
     */
    static findByIds(ids, params) {
        var _this9 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (!params) {
                params = {};
            }
            return yield _this9.find(
                _lodash2.default.merge(_lodash2.default.cloneDeep(params), { query: { id: ids } })
            );
        })();
    }

    /**
     * Finds one entity matched by given query parameters.
     * @param params
     */
    static findOne(params) {
        var _this10 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (!params) {
                params = {};
            }

            const prepared = _this10.__prepareParams(params);
            yield _this10.emit("query", prepared);

            const queryResult = yield _this10.getDriver().findOne(_this10, prepared);
            const result = queryResult.getResult();
            if (_lodash2.default.isObject(result)) {
                const pooled = _this10.getEntityPool().get(_this10, result.id);
                if (pooled) {
                    return pooled;
                }

                const entity = new _this10().setExisting().populateFromStorage(result);
                _this10.getEntityPool().add(entity);
                return entity;
            }
            return null;
        })();
    }

    /**
     * Finds one or more entities matched by given query parameters.
     * @param params
     */
    static find(params) {
        var _this11 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (!params) {
                params = {};
            }

            const prepared = _this11.__prepareParams(params);
            yield _this11.emit("query", prepared);

            const queryResult = yield _this11.getDriver().find(_this11, prepared);
            const entityCollection = new _entityCollection2.default()
                .setParams(prepared)
                .setMeta(queryResult.getMeta());
            const result = queryResult.getResult();
            if (result instanceof Array) {
                for (let i = 0; i < result.length; i++) {
                    const pooled = _this11.getEntityPool().get(_this11, result[i].id);
                    if (pooled) {
                        entityCollection.push(pooled);
                    } else {
                        const entity = new _this11().setExisting().populateFromStorage(result[i]);
                        _this11.getEntityPool().add(entity);
                        entityCollection.push(entity);
                    }
                }
            }

            return entityCollection;
        })();
    }

    /**
     * Counts total number of entities matched by given query parameters.
     * @param params
     */
    static count(params) {
        var _this12 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (!params) {
                params = {};
            }

            const prepared = _this12.__prepareParams(params);
            yield _this12.emit("query", prepared);

            const queryResult = yield _this12.getDriver().count(_this12, prepared);
            return queryResult.getResult();
        })();
    }

    /**
     * Registers a listener that will be triggered only on current entity instance.
     * @param name
     * @param callback
     */
    on(name, callback) {
        const eventHandler = new _eventHandler2.default(name, callback);
        if (!this.listeners[eventHandler.getName()]) {
            this.listeners[eventHandler.getName()] = [];
        }
        this.listeners[eventHandler.getName()].push(eventHandler);
        return eventHandler;
    }

    /**
     * Registers a listener that will be triggered on all entity instances of current class.
     * @param name
     * @param callback
     */
    static on(name, callback) {
        if (!this.listeners) {
            this.listeners = {};
        }

        const eventHandler = new _eventHandler2.default(name, callback);
        if (!this.listeners[eventHandler.getName()]) {
            this.listeners[eventHandler.getName()] = [];
        }
        this.listeners[eventHandler.getName()].push(eventHandler);
        return eventHandler;
    }

    /**
     * Emits an event, which will trigger both static and instance listeners.
     * @param name
     * @param data
     */
    emit(name, data = {}) {
        var _this13 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_this13.listeners[name]) {
                for (let i = 0; i < _this13.listeners[name].length; i++) {
                    yield _this13.listeners[name][i].execute(
                        (0, _assign2.default)({}, data, { entity: _this13 })
                    );
                }
            }

            if (_this13.constructor.listeners) {
                if (_this13.constructor.listeners[name]) {
                    for (let i = 0; i < _this13.constructor.listeners[name].length; i++) {
                        yield _this13.constructor.listeners[name][i].execute(
                            (0, _assign2.default)({}, data, { entity: _this13 })
                        );
                    }
                }
            }
            return _this13;
        })();
    }

    /**
     * Emits an event, which will trigger static event listeners.
     * @param name
     * @param data
     */
    static emit(name, data = {}) {
        var _this14 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_lodash2.default.get(_this14, "listeners." + name)) {
                for (let i = 0; i < _this14.listeners[name].length; i++) {
                    yield _this14.listeners[name][i].execute(
                        (0, _assign2.default)({}, data, { entity: _this14 })
                    );
                }
            }
        })();
    }

    /**
     * Creates a clone of given params first.
     * If soft delete functionality is enabled, this will append "deleted = false" filter, meaning only non-deleted
     * entities can be taken into consideration. If "deleted" flag was already set from the outside, it won't take any action.
     * @param params
     * @private
     */
    static __prepareParams(params) {
        const clone = _lodash2.default.cloneDeep(params);
        if (_lodash2.default.get(this, "crud.delete.soft") === true) {
            _lodash2.default.set(
                clone,
                "query.deleted",
                _lodash2.default.get(clone, "query.deleted", false)
            );
        }
        return clone;
    }
}

Entity.classId = null;
Entity.driver = new _driver2.default();
Entity.pool = new _entityPool2.default();
Entity.crud = {
    logs: false,
    delete: {
        soft: false
    }
};

exports.default = Entity;
//# sourceMappingURL=entity.js.map
