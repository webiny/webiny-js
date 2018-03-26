// @flow
import _ from "lodash";
import hash from "short-hash";
import fecha from "fecha";
import accounting from "accounting";

import type { Modifier } from "./../types";

import modifiers from "./modifiers";

/**
 * Main class used for all I18n needs.
 */
class I18N {
    locale: ?string;
    defaultFormats: Object;
    translations: Object;
    modifiers: Object;

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
        this.registerModifiers(modifiers);
    }

    translate(base: string, namespace: string): string | Function {
        // Returns full translation for given base text in given namespace (optional).
        // If translation isn't found, base text will be returned.
        // We create a key out of given namespace and base text.

        if (!namespace) {
            throw Error("I18N text namespace not defined.");
        }

        base = _.get(base, "raw.0", base);

        let translation = this.getTranslation(namespace + "." + hash(base));

        if (!translation) {
            translation = base;
        }

        const hasVariables = base.includes("{") && base.includes("}");
        if (!hasVariables) {
            return translation;
        }

        return (values: Object) => {
            return this.__replaceVariables(translation, values);
        };
    }

    /**
     * Formats and outputs date.
     * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
     * @param value
     * @param outputFormat
     * @param inputFormat
     */
    date(
        value: Date | string | number,
        outputFormat: ?string = null,
        inputFormat: string = "Y-m-dTH:i:sO"
    ): string {
        if (!outputFormat) {
            outputFormat = this.getDateFormat();
        }

        if (!(value instanceof Date)) {
            value = fecha.parse(value, inputFormat);
        }

        return fecha.format(value, outputFormat);
    }

    /**
     * Formats and outputs time.
     * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
     * @param value
     * @param outputFormat
     * @param inputFormat
     */
    time(
        value: Date | string | number,
        outputFormat: ?string = null,
        inputFormat: string = "Y-m-dTH:i:sO"
    ): string {
        if (!outputFormat) {
            outputFormat = this.getTimeFormat();
        }

        if (!(value instanceof Date)) {
            value = fecha.parse(value, inputFormat);
        }

        return fecha.format(value, outputFormat);
    }

    /**
     * Formats and outputs date/time.
     * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
     * @param value
     * @param outputFormat
     * @param inputFormat
     */
    dateTime(
        value: Date | string | number,
        outputFormat: ?string = null,
        inputFormat: string = "Y-m-dTH:i:sO"
    ): string {
        if (!outputFormat) {
            outputFormat = this.getDateTimeFormat();
        }

        if (!(value instanceof Date)) {
            value = fecha.parse(value, inputFormat);
        }

        return fecha.format(value, outputFormat);
    }

    /**
     * Outputs formatted number as amount of price.
     * @param value
     * @param outputFormat
     */
    price(value: string | number, outputFormat: ?Object): string {
        if (!outputFormat) {
            outputFormat = this.getPriceFormat();
        } else {
            outputFormat = _.assign({}, this.defaultFormats.price, outputFormat);
        }

        // Convert placeholders to accounting's placeholders.
        let format = outputFormat.format;
        format = format.replace("{symbol}", "%s");
        format = format.replace("{amount}", "%v");

        return accounting.formatMoney(
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
    number(value: string | number, outputFormat: ?Object): string {
        if (!outputFormat) {
            outputFormat = this.getNumberFormat();
        } else {
            outputFormat = _.assign({}, this.defaultFormats.number, outputFormat);
        }
        return accounting.formatNumber(
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
    getTranslation(key: ?string) {
        return this.translations[key];
    }

    /**
     * Returns all translations for current locale.
     * @returns {*|{}}
     */
    getTranslations(): Object {
        return this.translations;
    }

    /**
     * Returns true if given key has a translation for currently set locale.
     * @param key
     */
    hasTranslation(key: string): boolean {
        return key in this.translations;
    }

    /**
     * Sets translation for given text key.
     * @param key
     * @param translation
     * @returns {I18N}
     */
    setTranslation(key: string, translation: string): I18N {
        this.translations[key] = translation;
        return this;
    }

    /**
     * Sets translations that will be used.
     * @returns {*|{}}
     */
    setTranslations(translations: Object): I18N {
        this.translations = translations;
        return this;
    }

    /**
     * Clears all translations.
     * @returns {*|{}}
     */
    clearTranslations(): I18N {
        this.setTranslations({});
        return this;
    }

    /**
     * Merges given translations object with already existing.
     * @returns {*|{}}
     */

    mergeTranslations(translations: Object) {
        return _.assign(this.translations, translations);
    }

    /**
     * Returns currently selected locale (locale's key).
     */
    getLocale(): ?string {
        return this.locale;
    }

    /**
     * Sets current locale.
     */
    setLocale(locale: string): I18N {
        this.locale = locale;
        return this;
    }

    /**
     * Registers single modifier.
     * @returns {I18N}
     */
    registerModifier(modifier: Modifier): I18N {
        this.modifiers[modifier.name] = modifier;
        return this;
    }

    /**
     * Registers all modifiers in given array.
     * @param modifiers
     * @returns {I18N}
     */
    registerModifiers(modifiers: Array<Modifier>): I18N {
        modifiers.forEach(modifier => this.registerModifier(modifier));
        return this;
    }

    /**
     * Unregisters given modifier.
     * @param name
     * @returns {I18N}
     */
    unregisterModifier(name: string): I18N {
        delete this.modifiers[name];
        return this;
    }

    /**
     * Returns default formats
     * @returns {{date: string, time: string, datetime: string, number: string}}
     */
    getDefaultFormats(): Object {
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
    getDateFormat(): string {
        return _.get(this.locale, "formats.date", this.defaultFormats.date);
    }

    /**
     * Returns current format to be used when outputting time.
     */
    getTimeFormat(): string {
        return _.get(this.locale, "formats.time", this.defaultFormats.time);
    }

    /**
     * Returns current format to be used when outputting date/time.
     */
    getDateTimeFormat(): string {
        return _.get(this.locale, "formats.datetime", this.defaultFormats.datetime);
    }

    /**
     * Returns current format to be used when outputting prices.
     */
    getPriceFormat(): Object {
        return _.assign({}, this.defaultFormats.price, _.get(this.locale, "formats.price", {}));
    }

    /**
     * Returns current format to be used when outputting numbers.
     */
    getNumberFormat(): Object {
        return _.assign({}, this.defaultFormats.number, _.get(this.locale, "formats.number", {}));
    }

    __replaceVariables(text: string, values: Object): string {
        const parts = text.split(/({.*?})/);
        return parts.reduce((carry, part) => carry + this.__processTextPart(part, values), "");
    }

    __processTextPart(part: string, values: Object): string {
        // If not a variable, but an ordinary text, just return it, we don't need to do any extra processing with it.
        if (!_.startsWith(part, "{")) {
            return part;
        }

        part = _.trim(part, "{}");
        part = part.split("|");

        let [variable, modifier] = part;

        if (!_.has(values, variable)) {
            return `{${variable}}`;
        }

        // Check if we have received {value: ..., format: ...} object.
        const output = { value: values[variable], format: null };

        // If variable value is an object, the it must have 'value' key set.
        // We must also be sure we are not dealing with React component.
        if (_.isPlainObject(output.value) /* && !React.isValidElement(output.value)*/) {
            if (!_.has(output.value, "value")) {
                throw Error(`Key "value" is missing for variable {${variable}}.`);
            }

            // Before assigning real value, let's check if we have a custom formatter set.
            if (_.isFunction(output.value.format)) {
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

export default new I18N();
