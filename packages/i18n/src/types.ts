import I18N from "./I18n";
import { ReactElement } from "react";

export type I18NData = {
    translation: string;
    base: string;
    namespace: string;
    values: { [key: string]: any };
    i18n: I18N;
};

/**
 * @name Modifier
 * @description I18N Modifier - used for modifying text dynamically.
 */
export type Modifier = {
    name: string;
    execute: (...args: any[]) => string;
};

/**
 * @name Processor
 * @description I18N Processor - used for outputting text.
 */
export type Processor = {
    name: string;
    canExecute?: (data: I18NData) => boolean;
    execute: (data: I18NData) => string | ReactElement;
};

export type NumberFormat = {
    decimal: string;
    thousand: string;
    precision: number;
};

export type PriceFormat = {
    symbol: string;
    format: string;
    decimal: string;
    thousand: string;
    precision: number;
};

export type Formats = {
    date: string;
    time: string;
    datetime: string;
    price: PriceFormat;
    number: NumberFormat;
};

export type Translator = (base: any) => any;

export type Translations = { [key: string]: string };
