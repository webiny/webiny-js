"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyModel = require("webiny-model");

var _entity = require("./../entity");

var _entity2 = _interopRequireDefault(_entity);

var _entityCollection = require("./../entityCollection");

var _entityCollection2 = _interopRequireDefault(_entityCollection);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class EntitiesAttributeValue extends _webinyModel.AttributeValue {
    constructor(attribute) {
        super(attribute);

        this.current = new _entityCollection2.default();
        this.initial = new _entityCollection2.default();

        this.links = {
            dirty: false,
            set: false,
            current: new _entityCollection2.default(),
            initial: new _entityCollection2.default()
        };

        this.state = {
            loading: false,
            loaded: false
        };

        this.queue = [];
    }

    /**
     * Ensures data is loaded correctly, and in the end returns current value.
     * @returns {Promise<*>}
     */
    load() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_this.isLoading()) {
                return new _promise2.default(function(resolve) {
                    return _this.queue.push(resolve);
                });
            }

            if (_this.isLoaded()) {
                return;
            }

            const classes = _this.attribute.classes;

            _this.state.loading = true;

            if (
                _this.attribute
                    .getParentModel()
                    .getParentEntity()
                    .isExisting()
            ) {
                if (_this.attribute.getToStorage()) {
                    if (classes.using.class) {
                        if (_this.hasInitialLinks()) {
                            _this.links.initial = yield classes.using.class.findByIds(
                                _this.links.initial
                            );

                            _this.initial = new _entityCollection2.default();
                            for (let i = 0; i < _this.links.initial.length; i++) {
                                _this.initial.push(
                                    yield _this.links.initial[i][classes.using.attribute]
                                );
                            }
                        }
                    } else {
                        if (_this.hasInitial()) {
                            _this.initial = yield classes.entities.class.findByIds(_this.initial);
                        }
                    }
                } else {
                    let id = yield _this.attribute
                        .getParentModel()
                        .getAttribute("id")
                        .getStorageValue();

                    if (classes.using.class) {
                        _this.links.initial = yield classes.using.class.find({
                            query: { [classes.entities.attribute]: id }
                        });

                        _this.initial = new _entityCollection2.default();
                        for (let i = 0; i < _this.links.initial.length; i++) {
                            _this.initial.push(
                                yield _this.links.initial[i][classes.using.attribute]
                            );
                        }
                    } else {
                        _this.initial = yield classes.entities.class.find({
                            query: { [classes.entities.attribute]: id }
                        });
                    }
                }

                if (_this.isClean()) {
                    const initial = _this.getInitial();
                    const initialLinks = _this.getInitialLinks();
                    if (Array.isArray(initial) && Array.isArray(initialLinks)) {
                        _this.setCurrent(new _entityCollection2.default(initial), {
                            skipDifferenceCheck: true
                        });
                        if (classes.using.class) {
                            _this.setCurrentLinks(new _entityCollection2.default(initialLinks), {
                                skipDifferenceCheck: true
                            });
                        }
                    }
                }
            }

            _this.state.loading = false;
            _this.state.loaded = true;

            yield _this.__executeQueue();

            return _this.current;
        })();
    }

    setInitial(value) {
        this.initial = value;
        return this;
    }

    getInitial() {
        return this.initial;
    }

    hasInitial() {
        return this.getInitial().length > 0;
    }

    hasCurrent() {
        return this.getCurrent().length > 0;
    }

    deleteInitial() {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            // If initial is empty, that means nothing was ever loaded (attribute was not accessed) and there is nothing to do.
            // Otherwise, deleteInitial method will internally delete only entities that are not needed anymore.
            if (!_this2.hasInitial()) {
                return;
            }

            const initial = _this2.getInitial(),
                currentEntitiesIds = _this2.getCurrent().map(function(entity) {
                    return entity.id;
                });

            for (let i = 0; i < initial.length; i++) {
                const currentInitial = initial[i];
                if (currentInitial instanceof _entity2.default) {
                    if (!currentEntitiesIds.includes(currentInitial.id)) {
                        yield currentInitial.delete();
                    }
                }
            }
        })();
    }

    /**
     * Creates a new array that contains all currently loaded entities.
     */
    syncInitial() {
        this.initial = this.getCurrent().map(entity => entity);
    }

    manageCurrent() {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const current = _this3.getCurrent();

            for (let i = 0; i < current.length; i++) {
                const entity = current[i];
                yield entity.set(
                    _this3.attribute.classes.entities.attribute,
                    _this3.attribute.getParentModel().getParentEntity()
                );
            }
        })();
    }

    getInitialLinks() {
        return this.links.initial;
    }

    hasInitialLinks() {
        return this.getInitialLinks().length > 0;
    }

    setInitialLinks(value) {
        this.links.initial = value;
        return this;
    }

    getCurrentLinks() {
        return this.links.current;
    }

    hasCurrentLinks() {
        return this.getCurrentLinks().length > 0;
    }

    setCurrentLinks(value, options = {}) {
        this.links.set = true;

        if (!options.skipDifferenceCheck) {
            if (this.isDifferentFrom(value)) {
                this.links.dirty = true;
            }
        }

        this.links.current = value;
        return this;
    }

    deleteInitialLinks() {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            // If initial is empty, that means nothing was ever loaded (attribute was not accessed) and there is nothing to do.
            // Otherwise, deleteInitial method will internally delete only entities that are not needed anymore.
            if (!_this4.hasInitialLinks()) {
                return;
            }

            const initialLinks = _this4.getInitialLinks(),
                // $FlowIgnore
                currentLinksIds = _this4.getCurrentLinks().map(function(entity) {
                    return entity.id;
                });

            for (let i = 0; i < initialLinks.length; i++) {
                const initial = initialLinks[i];
                // $FlowIgnore
                if (!currentLinksIds.includes(initial.id)) {
                    initial instanceof _entity2.default && (yield initial.delete());
                }
            }
        })();
    }

    /**
     * Creates a new array that contains all currently loaded entities.
     */
    syncInitialLinks() {
        this.links.initial = this.getCurrentLinks().map(entity => entity);
    }

    manageCurrentLinks() {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const links = [],
                current = _this5.getCurrent(),
                currentLinks = _this5.getCurrentLinks();

            for (let i = 0; i < current.length; i++) {
                const currentEntity = current[i];

                // Following chunk actually represents: "_.find(currentLinks, link => link.group === current);".
                // "for" loop used because of async operations.
                let link = null;
                for (let j = 0; j < currentLinks.length; j++) {
                    // $FlowIgnore
                    const linkedEntity = yield currentLinks[j][
                        _this5.attribute.getUsingAttribute()
                    ];
                    if (linkedEntity === currentEntity) {
                        link = currentLinks[j];
                        break;
                    }
                }

                // If entity has an already existing link instance, it will be used. Otherwise a new instance will be created.
                // Links array cannot contain two same instances.
                if (link && !links.includes(link)) {
                    links.push(link);
                } else {
                    const entity = new (_this5.attribute.getUsingClass())();
                    yield entity.set(_this5.attribute.getUsingAttribute(), currentEntity);
                    yield entity.set(
                        _this5.attribute.getEntitiesAttribute(),
                        _this5.attribute.getParentModel().getParentEntity()
                    );
                    links.push(entity);
                }
            }

            _this5.setCurrentLinks(links);
        })();
    }

    /**
     * Value cannot be set as clean if ID is missing in one of the entities.
     * @returns {this}
     */
    clean() {
        const current = this.getCurrent();
        for (let i = 0; i < current.length; i++) {
            if (current[i] instanceof _entity2.default) {
                if (!current[i].id) {
                    return this;
                }
            }
        }

        return super.clean();
    }

    __executeQueue() {
        var _this6 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_this6.queue.length) {
                for (let i = 0; i < _this6.queue.length; i++) {
                    yield _this6.queue[i]();
                }
                _this6.queue = [];
            }
        })();
    }
}
exports.default = EntitiesAttributeValue;
//# sourceMappingURL=entitiesAttributeValue.js.map
