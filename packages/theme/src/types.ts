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

export type HeadingHtmlTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type ParagraphHtmlTag = "p";
export type ListHtmlTag = "ul" | "ol";
export type QuoteHtmlTag = "quoteblock";
export type ThemeTypographyHTMLTag = HeadingHtmlTag | ParagraphHtmlTag | ListHtmlTag | QuoteHtmlTag;
export type TypographyType = "headings" | "paragraphs" | "quotes" | "lists";
export type TypographyStyle<T extends ThemeTypographyHTMLTag> = {
    id: string;
    name: string;
    tag: T;
    css: Record<string, any>;
};

type Typography = {
    [typeName in TypographyType]: TypographyStyle<ThemeTypographyHTMLTag>[];
};

export interface ThemeStyles {
    colors: Record<string, any>;
    borderRadius?: number;
    typographyStyles: Typography;
    typography: Record<string, StylesObject>;
    elements: Record<string, Record<string, any> | StylesObject>;

    [key: string]: any;
}

export interface Theme {
    breakpoints: ThemeBreakpoints;
    styles: ThemeStyles;
}
