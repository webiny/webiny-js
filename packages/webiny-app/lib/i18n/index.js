"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray2 = require("babel-runtime/helpers/slicedToArray");

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _isNumber2 = require("lodash/isNumber");

var _isNumber3 = _interopRequireDefault(_isNumber2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _isPlainObject2 = require("lodash/isPlainObject");

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _has2 = require("lodash/has");

var _has3 = _interopRequireDefault(_has2);

var _trim2 = require("lodash/trim");

var _trim3 = _interopRequireDefault(_trim2);

var _startsWith2 = require("lodash/startsWith");

var _startsWith3 = _interopRequireDefault(_startsWith2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _isEmpty2 = require("lodash/isEmpty");

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _isDate2 = require("lodash/isDate");

var _isDate3 = _interopRequireDefault(_isDate2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _keys2 = require("lodash/keys");

var _keys3 = _interopRequireDefault(_keys2);

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _blueimpMd = require("blueimp-md5");

var _blueimpMd2 = _interopRequireDefault(_blueimpMd);

var _webiny = require("webiny");

var _webiny2 = _interopRequireDefault(_webiny);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _I18n = require("./I18n");

var _I18n2 = _interopRequireDefault(_I18n);

var _fecha = require("fecha");

var _fecha2 = _interopRequireDefault(_fecha);

var _accounting = require("accounting");

var _accounting2 = _interopRequireDefault(_accounting);

var _Modifiers = require("./Modifiers");

var _Modifiers2 = _interopRequireDefault(_Modifiers);

var _PhpJsMap = require("./PhpJsMap");

var _PhpJsMap2 = _interopRequireDefault(_PhpJsMap);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Main class used for all I18n needs.
 */
var I18n = (function() {
    function I18n() {
        var _this = this;

        (0, _classCallCheck3.default)(this, I18n);

        this.groups = { list: [] };
        this.locales = { current: null, list: [] };

        /**
         * If we fail to fetch formats for currently selected locale, these default formats will be used.
         * @type {{date: string, time: string, datetime: string, number: string}}
         */
        this.defaultFormats = {
            date: "d/m/Y",
            time: "h:i",
            datetime: "d/m/Y H:i",
            price: {
                symbol: "",
                format: "{symbol}{amount}",
                decimal: ".",
                thousand: ",",
                precision: 2
            },
            number: {
                decimal: ".",
                thousand: ", ",
                precision: 2
            }
        };

        /**
         * Cache key, received from server side.
         * @type {null}
         */
        this.cacheKey = null;

        /**
         * All currently-loaded translations, for easier (synchronous) access.
         * @type {{}}
         */
        this.translations = {};

        /**
         * Current React component used to render texts in the UI.
         * @type {component}
         */
        this.component = _I18n2.default;

        /**
         * All registered modifiers.
         * Default built-in modifiers are registered immediately below.
         * @type {{}}
         */
        this.modifiers = {};
        this.registerModifiers(_Modifiers2.default);

        /**
         * When users call Webiny.I18n(...), we won't to give them the translate method by default (for convenience sake).
         * @param base
         * @param variables
         * @param options
         * @returns {*}
         */
        var translate = function translate(base) {
            var variables = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

            if ((0, _isString3.default)(base) && (0, _isString3.default)(variables)) {
                var _key = _this.getTextKey(base, variables);
                return _this.translate(variables, options, _key);
            }

            var key = _this.getTextKey(options.namespace, base);
            return _this.translate(base, variables, key);
        };

        Object.getOwnPropertyNames(I18n.prototype).map(function(method) {
            if (method !== "constructor") {
                translate[method] = _this[method].bind(_this);
            }
        });

        return translate;
    }

    /**
     * Initializes i18n with given locale and current locale cache key.
     * @returns {*}
     */

    (0, _createClass3.default)(I18n, [
        {
            key: "init",
            value: (function() {
                var _ref = (0, _asyncToGenerator3.default)(
                    /*#__PURE__*/ _regenerator2.default.mark(function _callee() {
                        var _this2 = this;

                        var i18nCache, allJsApps, neededJsApps, api, response;
                        return _regenerator2.default.wrap(
                            function _callee$(_context) {
                                while (1) {
                                    switch ((_context.prev = _context.next)) {
                                        case 0:
                                            if (
                                                !(
                                                    !_webiny2.default.Config.I18n.enabled ||
                                                    !_webiny2.default.Config.I18n.locale
                                                )
                                            ) {
                                                _context.next = 2;
                                                break;
                                            }

                                            return _context.abrupt("return", this);

                                        case 2:
                                            this.setLocale(
                                                _webiny2.default.Config.I18n.locale
                                            ).setCacheKey(
                                                _webiny2.default.Config.I18n.locale.cacheKey
                                            );

                                            // Cached I18N translations from previous sessions.
                                            _context.next = 5;
                                            return _webiny2.default.IndexedDB.get("Webiny.I18n");

                                        case 5:
                                            i18nCache = _context.sent;
                                            allJsApps = (0, _keys3.default)(_webiny2.default.Apps);
                                            neededJsApps = [];

                                            // If we have the same cache key and the same locale, that means we have latest translations - we can safely read from local storage.

                                            if (
                                                i18nCache &&
                                                i18nCache.cacheKey === this.getCacheKey() &&
                                                i18nCache.locale === this.getLocale().key
                                            ) {
                                                // Oh yeah, we have the same cache key, but let's still check if we have a JS app which we didn't cache before maybe.
                                                allJsApps.forEach(function(jsApp) {
                                                    if (!i18nCache.translations[jsApp]) {
                                                        neededJsApps.push(jsApp);
                                                    }
                                                });
                                            } else {
                                                // If no cache, we must reset cache and fetch translations for all loaded JS apps.
                                                neededJsApps = allJsApps;
                                                i18nCache = null;
                                            }

                                            // If there are new apps to be added to the existing list of translations, let's load and update the cache.

                                            if (!(neededJsApps.length > 0)) {
                                                _context.next = 18;
                                                break;
                                            }

                                            api = new _webiny2.default.Api.Endpoint(
                                                "/entities/webiny/i18n-texts"
                                            );
                                            _context.next = 13;
                                            return api.get(
                                                "translations/locales/" + this.getLocale().key,
                                                { jsApps: neededJsApps }
                                            );

                                        case 13:
                                            response = _context.sent;

                                            // If we have a valid cache, let's just update translations in it.
                                            if (i18nCache) {
                                                (0, _each3.default)(
                                                    response.getData("translations"),
                                                    function(translations, jsApp) {
                                                        return (i18nCache.translations[
                                                            jsApp
                                                        ] = translations);
                                                    }
                                                );
                                            } else {
                                                // Otherwise, define it directly with data received in response.
                                                i18nCache = response.getData();
                                            }

                                            // Finally, let's do data normalization - put empty objects for JS apps that don't
                                            // have any translations yet, and thus weren't returned in response from the server.
                                            allJsApps.forEach(function(app) {
                                                if (!i18nCache.translations[app]) {
                                                    i18nCache.translations[app] = {};
                                                }
                                            });

                                            // Update the cache.
                                            _context.next = 18;
                                            return _webiny2.default.IndexedDB.set(
                                                "Webiny.I18n",
                                                i18nCache
                                            );

                                        case 18:
                                            // Let's store all keys/translations into I18N - data is flatten, meaning we don't have structure received from server anymore).
                                            (0, _each3.default)(i18nCache.translations, function(
                                                jsApps
                                            ) {
                                                (0, _each3.default)(jsApps, function(translations) {
                                                    return _this2.mergeTranslations(translations);
                                                });
                                            });

                                            // Finally, let's set i18n cookie, this constantly prolongs cookie expiration.
                                            _webiny2.default.Cookies.set(
                                                "webiny-i18n",
                                                this.getLocale().key,
                                                { expires: 30 }
                                            );
                                            _webiny2.default.Http.addRequestInterceptor(function(
                                                http
                                            ) {
                                                http.addHeader(
                                                    "X-Webiny-I18n",
                                                    _this2.getLocale().key
                                                );
                                            });

                                            return _context.abrupt("return", this);

                                        case 22:
                                        case "end":
                                            return _context.stop();
                                    }
                                }
                            },
                            _callee,
                            this
                        );
                    })
                );

                function init() {
                    return _ref.apply(this, arguments);
                }

                return init;
            })()

            /**
             * Changes current locale and refreshes the page so that I18N can be reinitialized and new translations immediately loaded.
             * @param locale
             */
        },
        {
            key: "setLocaleAndReload",
            value: function setLocaleAndReload(locale) {
                _webiny2.default.IndexedDB.remove("Webiny.I18n");
                _webiny2.default.Cookies.set("webiny-i18n", locale, { expires: 30 });
                location.reload();
            }

            /**
             * Returns full translation for given base text and optionally variables. If text key is not found, base text will be returned.
             * @param base
             * @param variables
             * @param textKey
             * @returns {*}
             */
        },
        {
            key: "translate",
            value: function translate(base) {
                var variables =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
                var textKey = arguments[2];

                var output = this.getTranslation(textKey) || base;
                return this.replaceVariables(output, variables);
            }

            /**
             * Formats and outputs date.
             * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
             * @param value
             * @param outputFormat
             * @param inputFormat
             */
        },
        {
            key: "date",
            value: function date(value) {
                var outputFormat =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                var inputFormat =
                    arguments.length > 2 && arguments[2] !== undefined
                        ? arguments[2]
                        : "Y-m-dTH:i:sO";

                if (!outputFormat) {
                    outputFormat = this.getDateFormat();
                }

                if (!(0, _isDate3.default)(value)) {
                    try {
                        value = _fecha2.default.parse(
                            value,
                            this.convertPhpToJsDateTimeFormat(inputFormat)
                        );
                    } catch (e) {
                        value = _fecha2.default.parse(value, "X");
                    }
                }

                return _fecha2.default.format(
                    value,
                    this.convertPhpToJsDateTimeFormat(outputFormat)
                );
            }

            /**
             * Formats and outputs time.
             * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
             * @param value
             * @param outputFormat
             * @param inputFormat
             */
        },
        {
            key: "time",
            value: function time(value) {
                var outputFormat =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                var inputFormat =
                    arguments.length > 2 && arguments[2] !== undefined
                        ? arguments[2]
                        : "Y-m-dTH:i:sO";

                if (!outputFormat) {
                    outputFormat = this.getTimeFormat();
                }

                if (!(0, _isDate3.default)(value)) {
                    try {
                        value = _fecha2.default.parse(
                            value,
                            this.convertPhpToJsDateTimeFormat(inputFormat)
                        );
                    } catch (e) {
                        value = _fecha2.default.parse(value, "X");
                    }
                }

                return _fecha2.default.format(
                    value,
                    this.convertPhpToJsDateTimeFormat(outputFormat)
                );
            }

            /**
             * Formats and outputs date/time.
             * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
             * @param value
             * @param outputFormat
             * @param inputFormat
             */
        },
        {
            key: "datetime",
            value: function datetime(value) {
                var outputFormat =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
                var inputFormat =
                    arguments.length > 2 && arguments[2] !== undefined
                        ? arguments[2]
                        : "Y-m-dTH:i:sO";

                if (!outputFormat) {
                    outputFormat = this.getDatetimeFormat();
                }

                if (!(0, _isDate3.default)(value)) {
                    try {
                        value = _fecha2.default.parse(
                            value,
                            this.convertPhpToJsDateTimeFormat(inputFormat)
                        );
                    } catch (e) {
                        value = _fecha2.default.parse(value, "X");
                    }
                }

                return _fecha2.default.format(
                    value,
                    this.convertPhpToJsDateTimeFormat(outputFormat)
                );
            }

            /**
             * Outputs formatted number as amount of price.
             * @param value
             * @param outputFormat
             */
        },
        {
            key: "price",
            value: function price(value) {
                var outputFormat =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

                if (!outputFormat) {
                    outputFormat = this.getPriceFormat();
                } else {
                    outputFormat = (0, _assign3.default)(
                        {},
                        this.defaultFormats.price,
                        outputFormat
                    );
                }

                // Let's convert Webiny format to accounting.
                var format = outputFormat.format;
                format = format.replace("{symbol}", "%s");
                format = format.replace("{amount}", "%v");

                return _accounting2.default.formatMoney(
                    value,
                    outputFormat.symbol,
                    outputFormat.precision,
                    outputFormat.thousand,
                    outputFormat.decimal,
                    format
                );
            }

            /**
             * Outputs formatted number.
             * @param value
             * @param outputFormat
             */
        },
        {
            key: "number",
            value: function number(value) {
                var outputFormat =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

                if (!outputFormat) {
                    outputFormat = this.getNumberFormat();
                } else {
                    outputFormat = (0, _assign3.default)(
                        {},
                        this.defaultFormats.number,
                        outputFormat
                    );
                }
                return _accounting2.default.formatNumber(
                    value,
                    outputFormat.precision,
                    outputFormat.thousand,
                    outputFormat.decimal
                );
            }

            /**
             * Sets I18N component which will be used for rendering texts.
             * @param component
             */
        },
        {
            key: "setComponent",
            value: function setComponent(component) {
                this.component = component;
            }

            /**
             * Returns currently set I18N component.
             * @param component
             * @returns {component|*}
             */
        },
        {
            key: "getComponent",
            value: function getComponent(component) {
                return this.component;
            }

            /**
             * Returns translation for given text key.
             * @param key
             * @returns {*|string}
             */
        },
        {
            key: "getTranslation",
            value: function getTranslation(key) {
                return this.translations[key] || "";
            }

            /**
             * Returns all translations for current locale.
             * @returns {*|{}}
             */
        },
        {
            key: "getTranslations",
            value: function getTranslations() {
                return this.translations;
            }

            /**
             * Returns true if given key has a translation for currently set locale.
             * @param key
             */
        },
        {
            key: "hasTranslation",
            value: function hasTranslation(key) {
                return !(0, _isEmpty3.default)(this.translations.key);
            }

            /**
             * Sets translation for given text key.
             * @param key
             * @param translation
             * @returns {I18n}
             */
        },
        {
            key: "setTranslation",
            value: function setTranslation(key, translation) {
                this.translations[key] = translation;
                return this;
            }

            /**
             * Sets translations that will be used.
             * @returns {*|{}}
             */
        },
        {
            key: "setTranslations",
            value: function setTranslations(translations) {
                this.translations = translations;
                return this;
            }

            /**
             * Merges given translations object with already existing.
             * @returns {*|{}}
             */
        },
        {
            key: "mergeTranslations",
            value: function mergeTranslations(translations) {
                return (0, _assign3.default)(this.translations, translations);
            }

            /**
             * Returns currently selected locale (locale's key).
             */
        },
        {
            key: "getLocale",
            value: function getLocale() {
                return this.locales.current;
            }

            /**
             * Returns a list of all available locales.
             */
        },
        {
            key: "getLocales",
            value: (function() {
                var _ref2 = (0, _asyncToGenerator3.default)(
                    /*#__PURE__*/ _regenerator2.default.mark(function _callee2() {
                        var query =
                            arguments.length > 0 && arguments[0] !== undefined
                                ? arguments[0]
                                : { _fields: "id,key,label,enabled" };
                        var response;
                        return _regenerator2.default.wrap(
                            function _callee2$(_context2) {
                                while (1) {
                                    switch ((_context2.prev = _context2.next)) {
                                        case 0:
                                            _context2.next = 2;
                                            return new _webiny2.default.Api.Endpoint(
                                                "/entities/webiny/i18n-locales"
                                            ).get(null, query);

                                        case 2:
                                            response = _context2.sent;

                                            this.locales.list = response.getData("list");
                                            return _context2.abrupt("return", this.locales.list);

                                        case 5:
                                        case "end":
                                            return _context2.stop();
                                    }
                                }
                            },
                            _callee2,
                            this
                        );
                    })
                );

                function getLocales() {
                    return _ref2.apply(this, arguments);
                }

                return getLocales;
            })()

            /**
             * Sets current locale.
             */
        },
        {
            key: "setLocale",
            value: function setLocale(locale) {
                this.locales.current = locale;
                return this;
            }

            /**
             * Returns a list of all available text groups.
             */
        },
        {
            key: "getTextGroups",
            value: (function() {
                var _ref3 = (0, _asyncToGenerator3.default)(
                    /*#__PURE__*/ _regenerator2.default.mark(function _callee3() {
                        var query =
                            arguments.length > 0 && arguments[0] !== undefined
                                ? arguments[0]
                                : { _fields: "id,app,name,description" };
                        var response;
                        return _regenerator2.default.wrap(
                            function _callee3$(_context3) {
                                while (1) {
                                    switch ((_context3.prev = _context3.next)) {
                                        case 0:
                                            _context3.next = 2;
                                            return new _webiny2.default.Api.Endpoint(
                                                "/entities/webiny/i18n-text-groups"
                                            ).get(null, query);

                                        case 2:
                                            response = _context3.sent;

                                            this.locales.list = response.getData("list");
                                            return _context3.abrupt("return", this.locales.list);

                                        case 5:
                                        case "end":
                                            return _context3.stop();
                                    }
                                }
                            },
                            _callee3,
                            this
                        );
                    })
                );

                function getTextGroups() {
                    return _ref3.apply(this, arguments);
                }

                return getTextGroups;
            })()

            /**
             * Sets current cache key (returned from server).
             * @param cacheKey
             * @returns {I18n}
             */
        },
        {
            key: "setCacheKey",
            value: function setCacheKey(cacheKey) {
                this.cacheKey = cacheKey;
                return this;
            }

            /**
             * Returns current cache key (returned from server).
             * @returns {*|null}
             */
        },
        {
            key: "getCacheKey",
            value: function getCacheKey() {
                return this.cacheKey;
            }

            /**
             * Registers single modifier.
             * @returns {I18n}
             */
        },
        {
            key: "registerModifier",
            value: function registerModifier(modifier) {
                this.modifiers[modifier.getName()] = modifier;
                return this;
            }

            /**
             * Registers all modifiers in given array.
             * @param modifiers
             * @returns {I18n}
             */
        },
        {
            key: "registerModifiers",
            value: function registerModifiers(modifiers) {
                var _this3 = this;

                modifiers.forEach(function(modifier) {
                    return _this3.registerModifier(modifier);
                });
                return this;
            }

            /**
             * Unregisters given modifier.
             * @param name
             * @returns {I18n}
             */
        },
        {
            key: "unregisterModifier",
            value: function unregisterModifier(name) {
                delete this.modifiers[name];
                return this;
            }

            /**
             * Returns default formats
             * @returns {{date: string, time: string, datetime: string, number: string}}
             */
        },
        {
            key: "getDefaultFormats",
            value: function getDefaultFormats() {
                return this.defaultFormats;
            }

            /**
             * Returns current format to be used when outputting dates.
             */
        },
        {
            key: "getDateFormat",
            value: function getDateFormat() {
                return (0, _get3.default)(
                    this.locales.current,
                    "formats.date",
                    this.defaultFormats.date
                );
            }

            /**
             * Returns current format to be used when outputting time.
             */
        },
        {
            key: "getTimeFormat",
            value: function getTimeFormat() {
                return (0, _get3.default)(
                    this.locales.current,
                    "formats.time",
                    this.defaultFormats.time
                );
            }

            /**
             * Returns current format to be used when outputting date/time.
             */
        },
        {
            key: "getDatetimeFormat",
            value: function getDatetimeFormat() {
                return (0, _get3.default)(
                    this.locales.current,
                    "formats.datetime",
                    this.defaultFormats.datetime
                );
            }

            /**
             * Returns current format to be used when outputting prices.
             */
        },
        {
            key: "getPriceFormat",
            value: function getPriceFormat() {
                return (0, _assign3.default)(
                    {},
                    this.defaultFormats.price,
                    (0, _get3.default)(this.locales.current, "formats.price", {})
                );
            }

            /**
             * Returns current format to be used when outputting numbers.
             */
        },
        {
            key: "getNumberFormat",
            value: function getNumberFormat() {
                return (0, _assign3.default)(
                    {},
                    this.defaultFormats.number,
                    (0, _get3.default)(this.locales.current, "formats.number", {})
                );
            }

            /**
             * Returns text key generated from given namespace and base text.
             * @param namespace
             * @param base
             * @returns {string}
             */
        },
        {
            key: "getTextKey",
            value: function getTextKey(namespace, base) {
                return namespace + "." + (0, _blueimpMd2.default)(base);
            }

            /**
             * Converts PHP formatting definition into JS (suitable for date/time plugin - fecha).
             * Check PhpJsMap.js for more information.
             * @param format
             * @returns {string}
             */
        },
        {
            key: "convertPhpToJsDateTimeFormat",
            value: function convertPhpToJsDateTimeFormat(format) {
                var output = "";
                for (var i = 0; i < format.length; i++) {
                    var current = format[i];
                    output +=
                        _PhpJsMap2.default[current] && _PhpJsMap2.default[current][0]
                            ? _PhpJsMap2.default[current][0]
                            : current;
                }

                return output;
            }

            /**
             * Processes text parts (used when translating texts).
             * @param part
             * @param values
             * @returns {*}
             */
        },
        {
            key: "processTextPart",
            value: function processTextPart(part, values) {
                // If not a variable, but an ordinary text, just return it, we don't need to do any extra processing with it.
                if (!(0, _startsWith3.default)(part, "{")) {
                    return part;
                }

                part = (0, _trim3.default)(part, "{}");
                part = part.split("|");

                var _part = part,
                    _part2 = (0, _slicedToArray3.default)(_part, 2),
                    variable = _part2[0],
                    modifier = _part2[1];

                if (!(0, _has3.default)(values, variable)) {
                    return "{" + variable + "}";
                }

                // Check if we have received {value: ..., format: ...} object.
                var output = { value: values[variable], format: null };

                // If variable value is an object, the it must have 'value' key set.
                // We must also be sure we are not dealing with React component.
                if (
                    (0, _isPlainObject3.default)(output.value) &&
                    !_react2.default.isValidElement(output.value)
                ) {
                    if (!(0, _has3.default)(output.value, "value")) {
                        throw Error('Key "value" is missing for variable {' + variable + "}.");
                    }

                    // Before assigning real value, let's check if we have a custom formatter set.
                    if ((0, _isFunction3.default)(output.value.format)) {
                        output.format = output.value.format;
                    }

                    output.value = output.value.value;
                }

                if (modifier) {
                    var parameters = modifier.split(":");
                    var name = parameters.shift();
                    if (this.modifiers[name]) {
                        var _modifier = this.modifiers[name];
                        output.value = _modifier.execute("" + output.value, parameters);
                    }
                }

                if (output.format) {
                    return output.format(output.value);
                }

                return output.value;
            }

            /**
             * This is responsible for replacing given text with given values.
             * It will automatically detect if it needs to return a string or JSX based on given variables
             * (if all variables are strings, then final output will also be returned as string)
             * @param text
             * @param values
             * @returns {*}
             */
        },
        {
            key: "replaceVariables",
            value: function replaceVariables(text, values) {
                var _this4 = this;

                if ((0, _isEmpty3.default)(values)) {
                    return text;
                }

                // Let's first check if we need to return pure string or JSX
                var stringOutput = true;
                (0, _each3.default)(values, function(value) {
                    if (!(0, _isString3.default)(value) && !(0, _isNumber3.default)(value)) {
                        stringOutput = false;
                        return false;
                    }
                });

                // Get text parts
                var parts = text.split(/(\{.*?\})/);

                if (stringOutput) {
                    return parts.reduce(function(carry, part) {
                        return carry + _this4.processTextPart(part, values);
                    }, "");
                }

                // Let's create a JSX output
                return parts.map(function(part, index) {
                    return _react2.default.createElement(
                        "webiny-i18n-part",
                        { key: index },
                        _this4.processTextPart(part, values)
                    );
                });
            }
        },
        {
            key: "toText",
            value: function toText(element) {
                if ((0, _isString3.default)(element) || (0, _isNumber3.default)(element)) {
                    return element;
                }

                if (_webiny2.default.elementHasFlag(element, "i18n")) {
                    var props = element.props;
                    return this.translate(props.base, props.variables, props.textKey);
                }

                return "";
            }

            /**
             * Used for rendering text in DOM
             * @param textKey
             * @param base
             * @param variables
             * @returns {XML}
             */
        },
        {
            key: "render",
            value: function render(textKey, base, variables) {
                return _react2.default.createElement(this.component, {
                    textKey: textKey,
                    base: base,
                    variables: variables
                });
            }
        }
    ]);
    return I18n;
})();

exports.default = new I18n();
//# sourceMappingURL=index.js.map
