import accounting from "accounting";
import * as fecha from "fecha";
/**
 * Package short-hash has no types.
 */
// @ts-expect-error
import hash from "short-hash";
import lodashAssign from "lodash/assign";
import lodashGet from "lodash/get";

import {
    Formats,
    I18NData,
    I18NDataValues,
    Modifier,
    NumberFormat,
    PriceFormat,
    Processor,
    ProcessorResult,
    Translations,
    Translator
} from "./types";

export type Translated =
    | ((values: I18NDataValues) => ProcessorResult | null)
    | ProcessorResult
    | null;
/**
 * Main class used for all I18n needs.
 */
export default class I18N {
    public locale: string | null = null;
    public defaultFormats: Formats;
    public translations: Translations;
    public modifiers: {
        [name: string]: Modifier;
    };
    public processors: {
        [name: string]: Processor;
    };

    public constructor() {
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

    public translate(base: string, namespace?: string): Translated {
        // Returns full translation for given base text in given namespace (optional).
        // If translation isn't found, base text will be returned.
        // We create a key out of given namespace and base text.

        if (!namespace) {
            throw Error("I18N text namespace not defined.");
        }

        base = lodashGet(base, "raw.0", base);

        let translation: string | null = this.getTranslation(namespace + "." + hash(base));

        if (!translation) {
            translation = base;
        }

        const hasVariables = base.includes("{") && base.includes("}");
        if (hasVariables) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const $this = this;
            return function i18n(values: I18NDataValues) {
                const data: I18NData = {
                    translation: translation as string,
                    base,
                    namespace,
                    values,
                    i18n: $this
                };
                for (const key in $this.processors) {
                    const processor = $this.processors[key];
                    if (processor.canExecute(data)) {
                        return processor.execute(data);
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

    public namespace(namespace: string): Translator {
        return base => {
            return this.translate(base as string, namespace);
        };
    }

    public ns(namespace: string): Translator {
        return this.namespace(namespace);
    }

    /**
     * Formats and outputs date.
     * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
     */
    public date(
        value: Date | string | number,
        outputFormat?: string,
        inputFormat?: string
    ): string {
        if (!outputFormat) {
            outputFormat = this.getDateFormat();
        }
        if (!inputFormat) {
            inputFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";
        }

        let parsedValue: number | Date;

        if (typeof value === "string") {
            parsedValue = fecha.parse(value, inputFormat) as Date;
        } else {
            parsedValue = value;
        }

        return fecha.format(parsedValue, outputFormat);
    }

    /**
     * Formats and outputs time.
     * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
     */
    public time(
        value: Date | string | number,
        outputFormat?: string,
        inputFormat?: string
    ): string {
        if (!outputFormat) {
            outputFormat = this.getTimeFormat();
        }
        if (!inputFormat) {
            inputFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";
        }

        let parsedValue: number | Date;

        if (typeof value === "string") {
            parsedValue = fecha.parse(value, inputFormat) as Date;
        } else {
            parsedValue = value;
        }

        return fecha.format(parsedValue, outputFormat);
    }

    /**
     * Formats and outputs date/time.
     * It will try to load format from currently selected locale's settings. If not defined, default formats will be used.
     */
    dateTime(value: Date | string | number, outputFormat?: string, inputFormat?: string): string {
        if (!outputFormat) {
            outputFormat = this.getDateTimeFormat();
        }
        if (!inputFormat) {
            inputFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";
        }

        let parsedValue: number | Date;

        if (typeof value === "string") {
            parsedValue = fecha.parse(value, inputFormat) as Date;
        } else {
            parsedValue = value;
        }

        return fecha.format(parsedValue, outputFormat);
    }

    /**
     * Outputs formatted number as amount of price.
     */
    public price(value: string | number, outputFormat?: any): string {
        if (!outputFormat) {
            outputFormat = this.getPriceFormat();
        } else {
            outputFormat = lodashAssign({}, this.defaultFormats.price, outputFormat);
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
     */
    public number(value: string | number, outputFormat?: NumberFormat): string {
        if (!outputFormat) {
            outputFormat = this.getNumberFormat();
        } else {
            outputFormat = lodashAssign({}, this.defaultFormats.number, outputFormat);
        }
        return accounting.formatNumber(
            /**
             * Cast as number because method transforms it internally.
             */
            value as number,
            outputFormat.precision,
            outputFormat.thousand,
            outputFormat.decimal
        );
    }

    /**
     * Returns translation for given text key.
     */
    public getTranslation(key?: string): string | null {
        if (!key) {
            return null;
        }
        return this.translations[key];
    }

    /**
     * Returns all translations for current locale.
     */
    public getTranslations(): Translations {
        return this.translations;
    }

    /**
     * Returns true if given key has a translation for currently set locale.
     */
    public hasTranslation(key: string): boolean {
        return key in this.translations;
    }

    /**
     * Sets translation for given text key.
     */
    public setTranslation(key: string, translation: string): I18N {
        this.translations[key] = translation;
        return this;
    }

    /**
     * Sets translations that will be used.
     */
    public setTranslations(translations: Translations): I18N {
        this.translations = translations;
        return this;
    }

    /**
     * Clears all translations.
     */
    public clearTranslations(): I18N {
        this.setTranslations({});
        return this;
    }

    /**
     * Merges given translations object with already existing.
     */

    public mergeTranslations(translations: Translations): Translations {
        return lodashAssign(this.translations, translations);
    }

    /**
     * Returns currently selected locale (locale's key).
     */
    public getLocale(): null | string {
        return this.locale;
    }

    /**
     * Sets current locale.
     */
    public setLocale(locale: string): I18N {
        this.locale = locale;
        return this;
    }

    /**
     * Registers single modifier.
     */
    public registerModifier(modifier: Modifier): I18N {
        this.modifiers[modifier.name] = modifier;
        return this;
    }

    /**
     * Registers all modifiers in given array.
     */
    public registerModifiers(modifiers: Array<Modifier>): I18N {
        modifiers.forEach(modifier => this.registerModifier(modifier));
        return this;
    }

    /**
     * Unregisters given modifier.
     */
    public unregisterModifier(name: string): I18N {
        delete this.modifiers[name];
        return this;
    }

    /**
     * Registers single processor.
     */
    public registerProcessor(processor: Processor): I18N {
        this.processors[processor.name] = processor;
        return this;
    }

    /**
     * Registers all processors in given array.
     */
    public registerProcessors(processors: Array<Processor>): I18N {
        processors.forEach(processor => this.registerProcessor(processor));
        return this;
    }

    /**
     * Unregisters given processor.
     */
    public unregisterProcessor(name: string): I18N {
        delete this.processors[name];
        return this;
    }

    /**
     * Returns default formats
     */
    public getDefaultFormats(): Formats {
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
    public getDateFormat(): string {
        return lodashGet(this.locale, "formats.date", this.defaultFormats.date);
    }

    /**
     * Returns current format to be used when outputting time.
     */
    public getTimeFormat(): string {
        return lodashGet(this.locale, "formats.time", this.defaultFormats.time);
    }

    /**
     * Returns current format to be used when outputting date/time.
     */
    public getDateTimeFormat(): string {
        return lodashGet(this.locale, "formats.datetime", this.defaultFormats.datetime);
    }

    /**
     * Returns current format to be used when outputting prices.
     */
    public getPriceFormat(): PriceFormat {
        return lodashAssign(
            {},
            this.defaultFormats.price,
            lodashGet(this.locale, "formats.price", {})
        );
    }

    /**
     * Returns current format to be used when outputting numbers.
     */
    public getNumberFormat(): NumberFormat {
        return lodashAssign(
            {},
            this.defaultFormats.number,
            lodashGet(this.locale, "formats.number", {})
        );
    }
}
