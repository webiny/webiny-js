/**
 * We are copy/pasting the `@webiny/theme/types` file here because of an issue
 * with our build system. This is not the case in users' projects. There we
 * simply import the types from `@webiny/theme` packages. See:
 * packages/cwp-template-aws/template/common/types/emotion/index.d.ts
 */

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

/*
 * Typography section
 */
export type HeadingHtmlTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type ParagraphHtmlTag = "p";
export type ListHtmlTag = "ul" | "ol";
export type QuoteHtmlTag = "quoteblock";
export type ThemeTypographyHTMLTag = HeadingHtmlTag | ParagraphHtmlTag | ListHtmlTag | QuoteHtmlTag;
export type TypographyType = "headings" | "paragraphs" | "quotes" | "lists" | string;
export type TypographyStyle = {
    id: string;
    name: string;
    tag: ThemeTypographyHTMLTag;
    css: CSSObject;
};

export type Typography = Record<TypographyType, TypographyStyle[]>;
export type ThemeTypographyStyleItems = TypographyStyle[];

export interface ThemeStyles {
    colors: Record<string, any>;
    borderRadius?: number;
    typography: Typography;
    elements: Record<string, Record<string, any> | StylesObject>;
    [key: string]: any;
}

/*
 * Decorated typography types
 */

export type DecoratedThemeTypographyStyles = ThemeTypographyStyleItems & {
    cssById: (id: string) => CSSObject | undefined;
    byId: (id: string) => TypographyStyle | undefined;
};

export type DecoratedTypography = Record<TypographyType, DecoratedThemeTypographyStyles>;

interface DecoratedThemeStyles extends Omit<ThemeStyles, "typography"> {
    colors: Record<string, any>;
    borderRadius?: number;
    typography: DecoratedTypography;
    elements: Record<string, Record<string, any> | StylesObject>;
    [key: string]: any;
}

export interface Theme {
    breakpoints: ThemeBreakpoints;
    styles: ThemeStyles;
}

export interface DecoratedTheme {
    breakpoints: ThemeBreakpoints;
    styles: DecoratedThemeStyles;
}

declare module "@emotion/react" {
    // Ignoring "@typescript-eslint/no-empty-interface" rule here.
    // eslint-disable-next-line
    export interface Theme extends DecoratedTheme {}
}
