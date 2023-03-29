import { type CSSObject } from "@emotion/core";
import {QueryableThemeStyle} from "~/utils/themeStyleFactory";
export type Content = Element;

/**
 * Should be a `CSSObject` object or an object with breakpoint names as keys and `CSSObject` objects as values.
 */
export interface StylesObject {
    [key: string]: CSSObject | string | number | undefined;
}

export type ThemeBreakpoints = Record<string, string>;

/*
* Typography section
* */
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
    css: CSSObject;
};

export interface QueryableThemeStyles extends ThemeStyles{
    typographyStyles: QueryableTypography;
}

// union of all theme style types typography, colors...
export type ThemeStyleItem = TypographyStyle<ThemeTypographyHTMLTag>;
export type Typography = {
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

export interface QueryableTheme extends Theme {
    styles: QueryableThemeStyles;
}
