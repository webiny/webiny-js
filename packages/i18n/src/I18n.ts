import _ from "lodash";
import hash from "short-hash";
import * as fecha from "fecha";
import accounting from "accounting";

import {
    Formats,
    I18NData,
    Modifier,
    NumberFormat,
    PriceFormat,
    Processor,
    Translations,
    Translator
} from "./types";

/**
 * Main class used for all I18n needs.
 */
export default class I18N {
    locale?: string;
    defaultFormats: Formats;
    translations: Translations;
    modifiers: { [name: string]: Modifier };
    processors: { [name: string]: Processor };

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
         * @type {{}}
         */
        this.modifiers = {};

        /**
         * All registered processors.
         * Default built-in processors are registered immediately below.
         * @type {{}}
         */
        this.processors = {};
    }

    translate(base: string, namespace?: string): any {
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
        if (hasVariables) {
            // @ts-ignore
            return values => {
                const data = { translation, base, namespace, values, i18n: this };
                for (const key in this.processors) {
                    if (this.processors[key].canExecute(data)) {
                        return this.processors[key].execute(data);
                    }
                }
                return null;
            };
        }

        const data: I18NData = { translation, base, namespace, values: {}, i18n: this };
        for (const key in this.processors) {
            if (this.processors[key].canExecute(data)) {
                return this.processors[key].execute(data);
            }
        }
        return null;
    }

    namespace(namespace: string): Translator {
        return base => {
            return this.translate(base as string, namespace);
        };
    }

    ns(namespace: string): Translator {
        return this.namespace(namespace);
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
        outputFormat?: string,
        inputFormat?: "YYYY-MM-DDTHH:mm:ss.SSSZ"
    ): string {
        if (!outputFormat) {
            outputFormat = this.getDateFormat();
        }

        let parsedValue: number | Date;

        if (typeof value === "string") {
            parsedValue = fecha.parse(value, inputFormat) as Date;
        }

        return fecha.format(parsedValue, outputFormat);
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
        outputFormat: string = null,
        inputFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ"
    ): string {
        if (!outputFormat) {
            outputFormat = this.getTimeFormat();
        }

        let parsedValue: number | Date;

        if (typeof value === "string") {
            parsedValue = fecha.parse(value, inputFormat) as Date;
        }

        return fecha.format(parsedValue, outputFormat);
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
        outputFormat: string = null,
        inputFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ"
    ): string {
        if (!outputFormat) {
            outputFormat = this.getDateTimeFormat();
        }

        let parsedValue: number | Date;

        if (typeof value === "string") {
            parsedValue = fecha.parse(value, inputFormat) as Date;
        }

        return fecha.format(parsedValue, outputFormat);
    }

    /**
     * Outputs formatted number as amount of price.
     * @param value
     * @param outputFormat
     */
    price(value: string | number, outputFormat?: any): string {
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
    number(value: string | number, outputFormat?: NumberFormat): string {
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
    getTranslation(key?: string) {
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
    setTranslations(translations: Translations): I18N {
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

    mergeTranslations(translations: Translations) {
        return _.assign(this.translations, translations);
    }

    /**
     * Returns currently selected locale (locale's key).
     */
    getLocale(): null | string {
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
     * Registers single processor.
     * @returns {I18N}
     */
    registerProcessor(processor: Processor): I18N {
        this.processors[processor.name] = processor;
        return this;
    }

    /**
     * Registers all processors in given array.
     * @param processors
     * @returns {I18N}
     */
    registerProcessors(processors: Array<Processor>): I18N {
        processors.forEach(processor => this.registerProcessor(processor));
        return this;
    }

    /**
     * Unregisters given processor.
     * @param name
     * @returns {I18N}
     */
    unregisterProcessor(name: string): I18N {
        delete this.processors[name];
        return this;
    }

    /**
     * Returns default formats
     * @returns {{date: string, time: string, datetime: string, number: string}}
     */
    getDefaultFormats(): Formats {
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
    getPriceFormat(): PriceFormat {
        return _.assign({}, this.defaultFormats.price, _.get(this.locale, "formats.price", {}));
    }

    /**
     * Returns current format to be used when outputting numbers.
     */
    getNumberFormat(): NumberFormat {
        return _.assign({}, this.defaultFormats.number, _.get(this.locale, "formats.number", {}));
    }
}