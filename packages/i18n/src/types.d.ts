import I18N from "./I18n";
import { ReactElement } from "react";
export declare type I18NData = {
    translation: string;
    base: string;
    namespace: string;
    values: {
        [key: string]: any;
    };
    i18n: I18N;
};
/**
 * @name Modifier
 * @description I18N Modifier - used for modifying text dynamically.
 */
export declare type Modifier = {
    name: string;
    execute: (...args: any[]) => string;
};
/**
 * @name Processor
 * @description I18N Processor - used for outputting text.
 */
export declare type Processor = {
    name: string;
    canExecute?: (data: I18NData) => boolean;
    execute: (data: I18NData) => string | ReactElement;
};
export declare type NumberFormat = {
    decimal: string;
    thousand: string;
    precision: number;
};
export declare type PriceFormat = {
    symbol: string;
    format: string;
    decimal: string;
    thousand: string;
    precision: number;
};
export declare type Formats = {
    date: string;
    time: string;
    datetime: string;
    price: PriceFormat;
    number: NumberFormat;
};
export declare type Translator = (base: any) => any;
export declare type Translations = {
    [key: string]: string;
};
