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

export type Typography = {
    [typeName in TypographyType]: TypographyStyle<ThemeTypographyHTMLTag>[];
};

export type WithCssById<T extends TypographyStyle<ThemeTypographyHTMLTag>[]> = T & {
    cssById(id: string): CSSObject;
};

export type WithById<T extends TypographyStyle<ThemeTypographyHTMLTag>[]> = T & {
    cssById(id: string): TypographyStyle<ThemeTypographyHTMLTag>;
};

export interface ThemeStyles {
    colors: Record<string, any>;
    borderRadius?: number;
    typography: Typography;
    elements: Record<string, Record<string, any> | StylesObject>;

    [key: string]: any;
}

export type DecoratedThemeStyles<T extends ThemeStyles> = T & {
    typography: { [K in keyof T["typography"]]: WithCssById<T[TypographyType][K]> };
};

export interface Theme {
    breakpoints: ThemeBreakpoints;
    styles: ThemeStyles;
}

export type DecoratedTheme = {
    breakpoints: ThemeBreakpoints;
    styles: DecoratedThemeStyles<ThemeStyles>;
};


type WTheme = Theme;

declare module "@emotion/react" {
    // Ignoring "@typescript-eslint/no-empty-interface" rule here.
    // eslint-disable-next-line
    export interface Theme extends WTheme {}
}
