import _ from "lodash";
import md5 from "blueimp-md5";
import { Webiny } from "./../../../index";
import React from "react";
import I18nComponent from "./I18n";
import fecha from "fecha";
import accounting from "accounting";

import modifiers from "./Modifiers";
import PhpJsMap from "./PhpJsMap";

/**
 * Main class used for all I18n needs.
 */
class I18n {
    constructor() {
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
        this.component = I18nComponent;

        /**
         * All registered modifiers.
         * Default built-in modifiers are registered immediately below.
         * @type {{}}
         */
        this.modifiers = {};
        this.registerModifiers(modifiers);

        /**
         * When users call Webiny.I18n(...), we won't to give them the translate method by default (for convenience sake).
         * @param base
         * @param variables
         * @param options
         * @returns {*}
         */
        const translate = (base, variables = {}, options = {}) => {
            if (_.isString(base) && _.isString(variables)) {
                const key = this.getTextKey(base, variables);
                return this.translate(variables, options, key);
            }

            const key = this.getTextKey(options.namespace, base);
            return this.translate(base, variables, key);
        };

        Object.getOwnPropertyNames(I18n.prototype).map(method => {
            if (method !== "constructor") {
                translate[method] = this[method].bind(this);
            }
        });

        return translate;
    }

    /**
     * Initializes i18n with given locale and current locale cache key.
     * @returns {*}
     */
    async init() {
        if (!Webiny.Config.I18n.enabled || !Webiny.Config.I18n.locale) {
            return this;
        }

        this.setLocale(Webiny.Config.I18n.locale).setCacheKey(Webiny.Config.I18n.locale.cacheKey);

        // Cached I18N translations from previous sessions.
        let i18nCache = await Webiny.IndexedDB.get("Webiny.I18n");

        const allJsApps = _.keys(Webiny.Apps);
        let neededJsApps = [];

        // If we have the same cache key and the same locale, that means we have latest translations - we can safely read from local storage.
        if (
            i18nCache &&
            i18nCache.cacheKey === this.getCacheKey() &&
            i18nCache.locale === this.getLocale().key
        ) {
            // Oh yeah, we have the same cache key, but let's still check if we have a JS app which we didn't cache before maybe.
            allJsApps.forEach(jsApp => {
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
        if (neededJsApps.length > 0) {
            const api = new Webiny.Api.Endpoint("/entities/webiny/i18n-texts");
            const response = await api.get("translations/locales/" + this.getLocale().key, {
                jsApps: neededJsApps
            });

            // If we have a valid cache, let's just update translations in it.
            if (i18nCache) {
                _.each(
                    response.getData("translations"),
                    (translations, jsApp) => (i18nCache.translations[jsApp] = translations)
                );
            } else {
                // Otherwise, define it directly with data received in response.
                i18nCache = response.getData();
            }

            // Finally, let's do data normalization - put empty objects for JS apps that don't
            // have any translations yet, and thus weren't returned in response from the server.
            allJsApps.forEach(app => {
                if (!i18nCache.translations[app]) {
                    i18nCache.translations[app] = {};
                }
            });

            // Update the cache.
            await Webiny.IndexedDB.set("Webiny.I18n", i18nCache);
        }

        // Let's store all keys/translations into I18N - data is flatten, meaning we don't have structure received from server anymore).
        _.each(i18nCache.translations, jsApps => {
            _.each(jsApps, translations => this.mergeTranslations(translations));
        });

        // Finally, let's set i18n cookie, this constantly prolongs cookie expiration.
        Webiny.Cookies.set("webiny-i18n", this.getLocale().key, { expires: 30 });
        Webiny.Http.addRequestInterceptor(http => {
            http.addHeader("X-Webiny-I18n", this.getLocale().key);
        });

        return this;
    }

    /**
     * Changes current locale and refreshes the page so that I18N can be reinitialized and new translations immediately loaded.
     * @param locale
     */
    setLocaleAndReload(locale) {
        Webiny.IndexedDB.remove("Webiny.I18n");
        Webiny.Cookies.set("webiny-i18n", locale, { expires: 30 });
        location.reload();
    }

    /**
     * Returns full translation for given base text and optionally variables. If text key is not found, base text will be returned.
     * @param base
     * @param variables
     * @param textKey
     * @returns {*}
     */
    translate(base, variables = {}, textKey) {
        let output = this.getTranslation(textKey) || base;
        return this.replaceVariables(output, variables);
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

        if (!_.isDate(value)) {
            try {
                value = fecha.parse(value, this.convertPhpToJsDateTimeFormat(inputFormat));
            } catch (e) {
                value = fecha.parse(value, "X");
            }
        }

        return fecha.format(value, this.convertPhpToJsDateTimeFormat(outputFormat));
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

        if (!_.isDate(value)) {
            try {
                value = fecha.parse(value, this.convertPhpToJsDateTimeFormat(inputFormat));
            } catch (e) {
                value = fecha.parse(value, "X");
            }
        }

        return fecha.format(value, this.convertPhpToJsDateTimeFormat(outputFormat));
    }

    /**
     * Formats and outputs date/time.
     * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
     * @param value
     * @param outputFormat
     * @param inputFormat
     */
    datetime(value, outputFormat = null, inputFormat = "Y-m-dTH:i:sO") {
        if (!outputFormat) {
            outputFormat = this.getDatetimeFormat();
        }

        if (!_.isDate(value)) {
            try {
                value = fecha.parse(value, this.convertPhpToJsDateTimeFormat(inputFormat));
            } catch (e) {
                value = fecha.parse(value, "X");
            }
        }

        return fecha.format(value, this.convertPhpToJsDateTimeFormat(outputFormat));
    }

    /**
     * Outputs formatted number as amount of price.
     * @param value
     * @param outputFormat
     */
    price(value, outputFormat = null) {
        if (!outputFormat) {
            outputFormat = this.getPriceFormat();
        } else {
            outputFormat = _.assign({}, this.defaultFormats.price, outputFormat);
        }

        // Let's convert Webiny format to accounting.
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
    number(value, outputFormat = null) {
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
     * Sets I18N component which will be used for rendering texts.
     * @param component
     */
    setComponent(component) {
        this.component = component;
    }

    /**
     * Returns currently set I18N component.
     * @param component
     * @returns {component|*}
     */
    getComponent(component) {
        return this.component;
    }

    /**
     * Returns translation for given text key.
     * @param key
     * @returns {*|string}
     */
    getTranslation(key) {
        return this.translations[key] || "";
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
        return !_.isEmpty(this.translations.key);
    }

    /**
     * Sets translation for given text key.
     * @param key
     * @param translation
     * @returns {I18n}
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
     * Merges given translations object with already existing.
     * @returns {*|{}}
     */
    mergeTranslations(translations) {
        return _.assign(this.translations, translations);
    }

    /**
     * Returns currently selected locale (locale's key).
     */
    getLocale() {
        return this.locales.current;
    }

    /**
     * Returns a list of all available locales.
     */
    async getLocales(query = { _fields: "id,key,label,enabled" }) {
        const response = await new Webiny.Api.Endpoint("/entities/webiny/i18n-locales").get(
            null,
            query
        );
        this.locales.list = response.getData("list");
        return this.locales.list;
    }

    /**
     * Sets current locale.
     */
    setLocale(locale) {
        this.locales.current = locale;
        return this;
    }

    /**
     * Returns a list of all available text groups.
     */
    async getTextGroups(query = { _fields: "id,app,name,description" }) {
        const response = await new Webiny.Api.Endpoint("/entities/webiny/i18n-text-groups").get(
            null,
            query
        );
        this.locales.list = response.getData("list");
        return this.locales.list;
    }

    /**
     * Sets current cache key (returned from server).
     * @param cacheKey
     * @returns {I18n}
     */
    setCacheKey(cacheKey) {
        this.cacheKey = cacheKey;
        return this;
    }

    /**
     * Returns current cache key (returned from server).
     * @returns {*|null}
     */
    getCacheKey() {
        return this.cacheKey;
    }

    /**
     * Registers single modifier.
     * @returns {I18n}
     */
    registerModifier(modifier) {
        this.modifiers[modifier.getName()] = modifier;
        return this;
    }

    /**
     * Registers all modifiers in given array.
     * @param modifiers
     * @returns {I18n}
     */
    registerModifiers(modifiers) {
        modifiers.forEach(modifier => this.registerModifier(modifier));
        return this;
    }

    /**
     * Unregisters given modifier.
     * @param name
     * @returns {I18n}
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
        return this.defaultFormats;
    }

    /**
     * Returns current format to be used when outputting dates.
     */
    getDateFormat() {
        return _.get(this.locales.current, "formats.date", this.defaultFormats.date);
    }

    /**
     * Returns current format to be used when outputting time.
     */
    getTimeFormat() {
        return _.get(this.locales.current, "formats.time", this.defaultFormats.time);
    }

    /**
     * Returns current format to be used when outputting date/time.
     */
    getDatetimeFormat() {
        return _.get(this.locales.current, "formats.datetime", this.defaultFormats.datetime);
    }

    /**
     * Returns current format to be used when outputting prices.
     */
    getPriceFormat() {
        return _.assign(
            {},
            this.defaultFormats.price,
            _.get(this.locales.current, "formats.price", {})
        );
    }

    /**
     * Returns current format to be used when outputting numbers.
     */
    getNumberFormat() {
        return _.assign(
            {},
            this.defaultFormats.number,
            _.get(this.locales.current, "formats.number", {})
        );
    }

    /**
     * Returns text key generated from given namespace and base text.
     * @param namespace
     * @param base
     * @returns {string}
     */
    getTextKey(namespace, base) {
        return namespace + "." + md5(base);
    }

    /**
     * Converts PHP formatting definition into JS (suitable for date/time plugin - fecha).
     * Check PhpJsMap.js for more information.
     * @param format
     * @returns {string}
     */
    convertPhpToJsDateTimeFormat(format) {
        let output = "";
        for (let i = 0; i < format.length; i++) {
            const current = format[i];
            output += PhpJsMap[current] && PhpJsMap[current][0] ? PhpJsMap[current][0] : current;
        }

        return output;
    }

    /**
     * Processes text parts (used when translating texts).
     * @param part
     * @param values
     * @returns {*}
     */
    processTextPart(part, values) {
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
        if (_.isPlainObject(output.value) && !React.isValidElement(output.value)) {
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
                output.value = modifier.execute("" + output.value, parameters);
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
    replaceVariables(text, values) {
        if (_.isEmpty(values)) {
            return text;
        }

        // Let's first check if we need to return pure string or JSX
        let stringOutput = true;
        _.each(values, value => {
            if (!_.isString(value) && !_.isNumber(value)) {
                stringOutput = false;
                return false;
            }
        });

        // Get text parts
        const parts = text.split(/(\{.*?\})/);

        if (stringOutput) {
            return parts.reduce((carry, part) => carry + this.processTextPart(part, values), "");
        }

        // Let's create a JSX output
        return parts.map((part, index) => (
            <webiny-i18n-part key={index}>{this.processTextPart(part, values)}</webiny-i18n-part>
        ));
    }

    toText(element) {
        if (_.isString(element) || _.isNumber(element)) {
            return element;
        }

        if (Webiny.elementHasFlag(element, "i18n")) {
            const props = element.props;
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
    render(textKey, base, variables) {
        return React.createElement(this.component, { textKey, base, variables });
    }
}

export default new I18n();
