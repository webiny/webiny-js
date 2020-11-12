import { Formats, Modifier, NumberFormat, PriceFormat, Processor, Translations, Translator } from "./types";
/**
 * Main class used for all I18n needs.
 */
export default class I18N {
    locale?: string;
    defaultFormats: Formats;
    translations: Translations;
    modifiers: {
        [name: string]: Modifier;
    };
    processors: {
        [name: string]: Processor;
    };
    constructor();
    translate(base: string, namespace?: string): any;
    namespace(namespace: string): Translator;
    ns(namespace: string): Translator;
    /**
     * Formats and outputs date.
     * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
     * @param value
     * @param outputFormat
     * @param inputFormat
     */
    date(value: Date | string | number, outputFormat?: string, inputFormat?: "YYYY-MM-DDTHH:mm:ss.SSSZ"): string;
    /**
     * Formats and outputs time.
     * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
     * @param value
     * @param outputFormat
     * @param inputFormat
     */
    time(value: Date | string | number, outputFormat?: string, inputFormat?: string): string;
    /**
     * Formats and outputs date/time.
     * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
     * @param value
     * @param outputFormat
     * @param inputFormat
     */
    dateTime(value: Date | string | number, outputFormat?: string, inputFormat?: string): string;
    /**
     * Outputs formatted number as amount of price.
     * @param value
     * @param outputFormat
     */
    price(value: string | number, outputFormat?: any): string;
    /**
     * Outputs formatted number.
     * @param value
     * @param outputFormat
     */
    number(value: string | number, outputFormat?: NumberFormat): string;
    /**
     * Returns translation for given text key.
     * @param key
     * @returns {*|string}
     */
    getTranslation(key?: string): string;
    /**
     * Returns all translations for current locale.
     * @returns {*|{}}
     */
    getTranslations(): Translations;
    /**
     * Returns true if given key has a translation for currently set locale.
     * @param key
     */
    hasTranslation(key: string): boolean;
    /**
     * Sets translation for given text key.
     * @param key
     * @param translation
     * @returns {I18N}
     */
    setTranslation(key: string, translation: string): I18N;
    /**
     * Sets translations that will be used.
     * @returns {*|{}}
     */
    setTranslations(translations: Translations): I18N;
    /**
     * Clears all translations.
     * @returns {*|{}}
     */
    clearTranslations(): I18N;
    /**
     * Merges given translations object with already existing.
     * @returns {*|{}}
     */
    mergeTranslations(translations: Translations): Translations;
    /**
     * Returns currently selected locale (locale's key).
     */
    getLocale(): null | string;
    /**
     * Sets current locale.
     */
    setLocale(locale: string): I18N;
    /**
     * Registers single modifier.
     * @returns {I18N}
     */
    registerModifier(modifier: Modifier): I18N;
    /**
     * Registers all modifiers in given array.
     * @param modifiers
     * @returns {I18N}
     */
    registerModifiers(modifiers: Array<Modifier>): I18N;
    /**
     * Unregisters given modifier.
     * @param name
     * @returns {I18N}
     */
    unregisterModifier(name: string): I18N;
    /**
     * Registers single processor.
     * @returns {I18N}
     */
    registerProcessor(processor: Processor): I18N;
    /**
     * Registers all processors in given array.
     * @param processors
     * @returns {I18N}
     */
    registerProcessors(processors: Array<Processor>): I18N;
    /**
     * Unregisters given processor.
     * @param name
     * @returns {I18N}
     */
    unregisterProcessor(name: string): I18N;
    /**
     * Returns default formats
     * @returns {{date: string, time: string, datetime: string, number: string}}
     */
    getDefaultFormats(): Formats;
    /**
     * Returns current format to be used when outputting dates.
     */
    getDateFormat(): string;
    /**
     * Returns current format to be used when outputting time.
     */
    getTimeFormat(): string;
    /**
     * Returns current format to be used when outputting date/time.
     */
    getDateTimeFormat(): string;
    /**
     * Returns current format to be used when outputting prices.
     */
    getPriceFormat(): PriceFormat;
    /**
     * Returns current format to be used when outputting numbers.
     */
    getNumberFormat(): NumberFormat;
}
