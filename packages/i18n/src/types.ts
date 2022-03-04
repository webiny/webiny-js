import I18N from "./I18n";
import { ReactElement } from "react";

export interface I18NDataValues {
    [key: string]: any;
}
export interface I18NData {
    translation: string;
    base: string;
    namespace: string;
    values: I18NDataValues;
    i18n: I18N;
}

export interface ModifierOptions {
    i18n: I18N;
}
/**
 * @description I18N Modifier - used for modifying text dynamically.
 */
export interface Modifier {
    name: string;
    execute: (...args: any[]) => string;
}

export type ProcessorResult = string | ReactElement;
/**
 * @description I18N Processor - used for outputting text.
 */
export interface Processor {
    name: string;
    canExecute: (data: I18NData) => boolean;
    execute: (data: I18NData) => ProcessorResult;
}

export interface NumberFormat {
    decimal: string;
    thousand: string;
    precision: number;
}

export interface PriceFormat {
    symbol: string;
    format: string;
    decimal: string;
    thousand: string;
    precision: number;
}

export interface Formats {
    date: string;
    time: string;
    datetime: string;
    price: PriceFormat;
    number: NumberFormat;
}

export interface Translator {
    (base: any): any;
}

export interface Translations {
    [key: string]: string;
}
