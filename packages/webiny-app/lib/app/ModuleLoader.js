"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _has2 = require("lodash/has");

var _has3 = _interopRequireDefault(_has2);

var _isNil2 = require("lodash/isNil");

var _isNil3 = _interopRequireDefault(_isNil2);

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _isPlainObject2 = require("lodash/isPlainObject");

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _isArray2 = require("lodash/isArray");

var _isArray3 = _interopRequireDefault(_isArray2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ModuleLoader = (function() {
    function ModuleLoader() {
        (0, _classCallCheck3.default)(this, ModuleLoader);

        this.registeredModules = {};
        this.contextModules = {};
        this.configurations = {};
    }

    (0, _createClass3.default)(ModuleLoader, [
        {
            key: "load",
            value: function load(requiredModules) {
                var _this = this;

                var options =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                var toLoad = requiredModules;
                var modules = {};
                if ((0, _isArray3.default)(toLoad)) {
                    toLoad.map(function(name, key) {
                        // String value is most probably a Webiny/Core component name
                        if ((0, _isString3.default)(name)) {
                            modules[name] = name;
                            return;
                        }

                        // Function value is most probably a vendor that does not export anything (attaches to jQuery or window directly)
                        if ((0, _isFunction3.default)(name)) {
                            modules[key] = name;
                            return;
                        }

                        // Object value is a custom map of modules (Webiny/Core components or import statements) to a desired prop name
                        if ((0, _isPlainObject3.default)(name)) {
                            (0, _each3.default)(name, function(value, key) {
                                modules[key] = value;
                            });
                        }
                    });
                } else if ((0, _isString3.default)(toLoad)) {
                    modules[toLoad] = toLoad;
                } else {
                    modules = toLoad;
                }

                var keys = Object.keys(modules);

                var imports = keys.map(function(key) {
                    var module = modules[key];
                    if ((0, _isString3.default)(module)) {
                        module = _this.registeredModules[module];
                    }

                    var callable = (0, _isPlainObject3.default)(module)
                        ? module.factory
                        : (0, _isFunction3.default)(module) ? module : _noop3.default;

                    return Promise.resolve(callable(options))
                        .then(function(m) {
                            return m && m.hasOwnProperty("default") ? m.default : m;
                        })
                        .catch(function(err) {
                            console.log("[Failed to import]", key, module);
                            console.error(err);
                        });
                });

                return Promise.all(imports)
                    .then(function(values) {
                        // Map loaded modules to requested modules object
                        var loadedModules = {};
                        keys.map(function(key, i) {
                            // Only assign modules that export something (often vendor libraries like owlCarousel, select2, etc. do not export anything)
                            if (!(0, _isNil3.default)(values[i])) {
                                // Assign loaded module and the original source path which will be used for optional configuration of component
                                // Source path is the name that was used to register a module via `Webiny.registerModule()` call
                                loadedModules[key] = { module: values[i], source: modules[key] };
                            }
                        });
                        return loadedModules;
                    })
                    .then(function(loadedModules) {
                        // Configure modules
                        var configure = [];
                        (0, _each3.default)(loadedModules, function(obj, name) {
                            // Only configure modules that are requested as string
                            if (
                                _this.registeredModules[obj.source] &&
                                (0, _has3.default)(_this.configurations, obj.source) &&
                                !_this.configurations[obj.source].configured
                            ) {
                                // build promise chain to configure each component
                                var chain = Promise.resolve();
                                (0, _get3.default)(
                                    _this.configurations[obj.source],
                                    "configs",
                                    []
                                ).map(function(config) {
                                    // We support async configuration functions to allow 3rd party apps to lazy load their configuration code
                                    // when the component is actually used
                                    chain = chain.then(function() {
                                        return config(obj.module);
                                    });
                                });
                                configure.push(
                                    chain.then(function() {
                                        return (_this.configurations[obj.source].configured = true);
                                    })
                                );
                            }
                        });

                        return Promise.all(configure).then(function() {
                            var returnModules = {};
                            (0, _each3.default)(loadedModules, function(obj, name) {
                                returnModules[name] = obj.module;
                            });

                            return (0, _isString3.default)(toLoad)
                                ? returnModules[toLoad]
                                : returnModules;
                        });
                    });
            }
        },
        {
            key: "loadByTag",
            value: function loadByTag(tag) {
                var modules = [];
                (0, _each3.default)(this.registeredModules, function(module, name) {
                    if ((0, _isArray3.default)(module.tags) && module.tags.includes(tag)) {
                        modules.push(name);
                    }
                });
                return this.load(modules);
            }
        },
        {
            key: "getContextModule",
            value: function getContextModule(context) {
                return this.contextModules[context];
            }
        },
        {
            key: "register",
            value: function register(modules) {
                var _this2 = this;

                modules = Array.isArray(modules) ? modules : [modules];
                modules.map(function(module) {
                    _this2.registeredModules[module.name] = module;
                    if (module.context) {
                        _this2.contextModules[module.context] = module;
                    }
                });
            }
        },
        {
            key: "configure",
            value: function configure(name, config) {
                var current = (0, _get3.default)(this.configurations, name, {
                    configured: false,
                    configs: []
                });
                current.configs.push(config);
                this.configurations[name] = current;
            }
        }
    ]);
    return ModuleLoader;
})();

exports.default = ModuleLoader;
//# sourceMappingURL=ModuleLoader.js.map
