import { type CSSObject } from "@emotion/react";

export type Content = Element;

/**
 * Should be a `CSSObject` object or an object with breakpoint names as keys and `CSSObject` objects as values.
 */
export interface StylesObject {
    [key: string]: CSSObject | string | number | undefined;
}

export enum DefaultThemeBreakpoint {
    DESKTOP = "desktop",
    TABLET = "tablet",
    MOBILE_LANDSCAPE = "mobile-landscape",
    MOBILE_PORTRAIT = "mobile-portrait"
}

export type ThemeBreakpoints = {
    [DefaultThemeBreakpoint.DESKTOP]: string;
    [DefaultThemeBreakpoint.TABLET]: string;
    [DefaultThemeBreakpoint.MOBILE_LANDSCAPE]: string;
    [DefaultThemeBreakpoint.MOBILE_PORTRAIT]: string;

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
