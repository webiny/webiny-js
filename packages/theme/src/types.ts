import { type CSSObject } from "@emotion/react";

export type Content = Element;

/**
 * Should be a `CSSObject` object or an object with breakpoint names as keys and `CSSObject` objects as values.
 */
export interface StylesObject {
    [key: string]: CSSObject | string | number | undefined;
}

export enum DefaultThemeBreakpoints {
    DESKTOP = "desktop",
    TABLET = "tablet",
    MOBILE_LANDSCAPE = "mobile-landscape",
    MOBILE_PORTRAIT = "mobile-portrait"
}

export type ThemeBreakpoints = {
    [DefaultThemeBreakpoints.DESKTOP]: string;
    [DefaultThemeBreakpoints.TABLET]: string;
    [DefaultThemeBreakpoints.MOBILE_LANDSCAPE]: string;
    [DefaultThemeBreakpoints.MOBILE_PORTRAIT]: string;

    [key: string]: string;
};

export interface ThemeStyles {
    colors: Record<string, any>;
    borderRadius?: number;
    typography: Record<string, StylesObject>;
    elements: Record<string, Record<string, any> | StylesObject>;

    [key: string]: any;
}

export interface Theme {
    breakpoints: ThemeBreakpoints;
    styles: ThemeStyles;
}
