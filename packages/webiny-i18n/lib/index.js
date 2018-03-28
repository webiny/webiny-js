"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _shortHash = require("short-hash");

var _shortHash2 = _interopRequireDefault(_shortHash);

var _fecha = require("fecha");

var _fecha2 = _interopRequireDefault(_fecha);

var _accounting = require("accounting");

var _accounting2 = _interopRequireDefault(_accounting);

var _modifiers = require("./modifiers");

var _modifiers2 = _interopRequireDefault(_modifiers);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Main class used for all I18n needs.
 */
class I18N {
    constructor() {
        this.locale = null;

        /**
         * If we fail to fetch formats for currently selected locale, these default formats will be used.
         * @type {{date: string, time: string, datetime: string, number: string}}
         */
        this.defaultFormats = this.getDefaultFormats();

        /**
         * All currently-loaded translations, for easier (synchronous) access.
         * @type {{}}
         */
        this.translations = {};

        /**
         * All registered modifiers.
         * Default built-in modifiers are registered immediately below.
         * @type {{}}
         */
        this.modifiers = {};
        this.registerModifiers(_modifiers2.default);
    }

    translate(base, namespace) {
        // Returns full translation for given base text in given namespace (optional).
        // If translation isn't found, base text will be returned.
        // We create a key out of given namespace and base text.

        if (!namespace) {
            throw Error("I18N text namespace not defined.");
        }

        base = _lodash2.default.get(base, "raw.0", base);

        let translation = this.getTranslation(namespace + "." + (0, _shortHash2.default)(base));

        if (!translation) {
            translation = base;
        }

        const hasVariables = base.includes("{") && base.includes("}");
        if (!hasVariables) {
            return translation;
        }

        return values => {
            return this.__replaceVariables(translation, values);
        };
    }

    namespace(namespace) {
        return base => {
            return this.translate(base, namespace);
        };
    }

    /**
     * Formats and outputs date.
     * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
     * @param value
     * @param outputFormat
     * @param inputFormat
     */
    date(value, outputFormat = null, inputFormat = "Y-m-dTH:i:sO") {
        if (!outputFormat) {
            outputFormat = this.getDateFormat();
        }

        if (!(value instanceof Date)) {
            value = _fecha2.default.parse(value, inputFormat);
        }

        return _fecha2.default.format(value, outputFormat);
    }

    /**
     * Formats and outputs time.
     * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
     * @param value
     * @param outputFormat
     * @param inputFormat
     */
    time(value, outputFormat = null, inputFormat = "Y-m-dTH:i:sO") {
        if (!outputFormat) {
            outputFormat = this.getTimeFormat();
        }

        if (!(value instanceof Date)) {
            value = _fecha2.default.parse(value, inputFormat);
        }

        return _fecha2.default.format(value, outputFormat);
    }

    /**
     * Formats and outputs date/time.
     * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
     * @param value
     * @param outputFormat
     * @param inputFormat
     */
    dateTime(value, outputFormat = null, inputFormat = "Y-m-dTH:i:sO") {
        if (!outputFormat) {
            outputFormat = this.getDateTimeFormat();
        }

        if (!(value instanceof Date)) {
            value = _fecha2.default.parse(value, inputFormat);
        }

        return _fecha2.default.format(value, outputFormat);
    }

    /**
     * Outputs formatted number as amount of price.
     * @param value
     * @param outputFormat
     */
    price(value, outputFormat) {
        if (!outputFormat) {
            outputFormat = this.getPriceFormat();
        } else {
            outputFormat = _lodash2.default.assign({}, this.defaultFormats.price, outputFormat);
        }

        // Convert placeholders to accounting's placeholders.
        let format = outputFormat.format;
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
    number(value, outputFormat) {
        if (!outputFormat) {
            outputFormat = this.getNumberFormat();
        } else {
            outputFormat = _lodash2.default.assign({}, this.defaultFormats.number, outputFormat);
        }
        return _accounting2.default.formatNumber(
            value,
            outputFormat.precision,
            outputFormat.thousand,
            outputFormat.decimal
        );
    }

    /**
     * Returns translation for given text key.
     * @param key
     * @returns {*|string}
     */
    getTranslation(key) {
        return this.translations[key];
    }

    /**
     * Returns all translations for current locale.
     * @returns {*|{}}
     */
    getTranslations() {
        return this.translations;
    }

    /**
     * Returns true if given key has a translation for currently set locale.
     * @param key
     */
    hasTranslation(key) {
        return key in this.translations;
    }

    /**
     * Sets translation for given text key.
     * @param key
     * @param translation
     * @returns {I18N}
     */
    setTranslation(key, translation) {
        this.translations[key] = translation;
        return this;
    }

    /**
     * Sets translations that will be used.
     * @returns {*|{}}
     */
    setTranslations(translations) {
        this.translations = translations;
        return this;
    }

    /**
     * Clears all translations.
     * @returns {*|{}}
     */
    clearTranslations() {
        this.setTranslations({});
        return this;
    }

    /**
     * Merges given translations object with already existing.
     * @returns {*|{}}
     */

    mergeTranslations(translations) {
        return _lodash2.default.assign(this.translations, translations);
    }

    /**
     * Returns currently selected locale (locale's key).
     */
    getLocale() {
        return this.locale;
    }

    /**
     * Sets current locale.
     */
    setLocale(locale) {
        this.locale = locale;
        return this;
    }

    /**
     * Registers single modifier.
     * @returns {I18N}
     */
    registerModifier(modifier) {
        this.modifiers[modifier.name] = modifier;
        return this;
    }

    /**
     * Registers all modifiers in given array.
     * @param modifiers
     * @returns {I18N}
     */
    registerModifiers(modifiers) {
        modifiers.forEach(modifier => this.registerModifier(modifier));
        return this;
    }

    /**
     * Unregisters given modifier.
     * @param name
     * @returns {I18N}
     */
    unregisterModifier(name) {
        delete this.modifiers[name];
        return this;
    }

    /**
     * Returns default formats
     * @returns {{date: string, time: string, datetime: string, number: string}}
     */
    getDefaultFormats() {
        return {
            date: "DD/MM/YYYY",
            time: "HH:mm",
            datetime: "DD/MM/YYYY HH:mm",
            price: {
                symbol: "",
                format: "{symbol}{amount}",
                decimal: ".",
                thousand: ",",
                precision: 2
            },
            number: {
                decimal: ".",
                thousand: ",",
                precision: 2
            }
        };
    }

    /**
     * Returns current format to be used when outputting dates.
     */
    getDateFormat() {
        return _lodash2.default.get(this.locale, "formats.date", this.defaultFormats.date);
    }

    /**
     * Returns current format to be used when outputting time.
     */
    getTimeFormat() {
        return _lodash2.default.get(this.locale, "formats.time", this.defaultFormats.time);
    }

    /**
     * Returns current format to be used when outputting date/time.
     */
    getDateTimeFormat() {
        return _lodash2.default.get(this.locale, "formats.datetime", this.defaultFormats.datetime);
    }

    /**
     * Returns current format to be used when outputting prices.
     */
    getPriceFormat() {
        return _lodash2.default.assign(
            {},
            this.defaultFormats.price,
            _lodash2.default.get(this.locale, "formats.price", {})
        );
    }

    /**
     * Returns current format to be used when outputting numbers.
     */
    getNumberFormat() {
        return _lodash2.default.assign(
            {},
            this.defaultFormats.number,
            _lodash2.default.get(this.locale, "formats.number", {})
        );
    }

    __replaceVariables(text, values) {
        const parts = text.split(/({.*?})/);
        return parts.reduce((carry, part) => carry + this.__processTextPart(part, values), "");
    }

    __processTextPart(part, values) {
        // If not a variable, but an ordinary text, just return it, we don't need to do any extra processing with it.
        if (!_lodash2.default.startsWith(part, "{")) {
            return part;
        }

        part = _lodash2.default.trim(part, "{}");
        part = part.split("|");

        let [variable, modifier] = part;

        if (!_lodash2.default.has(values, variable)) {
            return `{${variable}}`;
        }

        // Check if we have received {value: ..., format: ...} object.
        const output = { value: values[variable], format: null };

        // If variable value is an object, the it must have 'value' key set.
        // We must also be sure we are not dealing with React component.
        if (
            _lodash2.default.isPlainObject(output.value) /* && !React.isValidElement(output.value)*/
        ) {
            if (!_lodash2.default.has(output.value, "value")) {
                throw Error(`Key "value" is missing for variable {${variable}}.`);
            }

            // Before assigning real value, let's check if we have a custom formatter set.
            if (_lodash2.default.isFunction(output.value.format)) {
                output.format = output.value.format;
            }

            output.value = output.value.value;
        }

        if (modifier) {
            let parameters = modifier.split(":");
            let name = parameters.shift();
            if (this.modifiers[name]) {
                const modifier = this.modifiers[name];
                output.value = modifier.execute(output.value, parameters);
            }
        }

        if (output.format) {
            return output.format(output.value);
        }

        return output.value;
    }
}
exports.default = new I18N();
//# sourceMappingURL=index.js.map
