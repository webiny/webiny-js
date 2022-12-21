import { type CSSObject } from "@emotion/core";

export type Content = Element;

/**
 * Should be a `CSSObject` object or an object with breakpoint names as keys and `CSSObject` objects as values.
 */
export interface StylesObjects {
    [key: string]: CSSObject | string | number | undefined;
}

export interface Breakpoint {
    mediaQuery: string;
}

export type ThemeBreakpoints = Record<string, Breakpoint>;

export interface ThemeStyles {
    colors: Record<string, any>;
    borderRadius?: number;
    typography: Record<string, StylesObjects>;
    elements: Record<string, Record<string, any> | StylesObjects>;

    [key: string]: any;
}

export interface Theme {
    breakpoints: ThemeBreakpoints;
    styles: ThemeStyles;
}
