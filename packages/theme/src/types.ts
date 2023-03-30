import { type CSSObject } from "@emotion/core";
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

export type Typography = {
    [typeName in TypographyType]: TypographyStyle<ThemeTypographyHTMLTag>[];
};

export type WithById<T extends TypographyStyle<ThemeTypographyHTMLTag>[]> = T & {
    byId(id: string): TypographyStyle<ThemeTypographyHTMLTag>;
};

export interface ThemeStyles {
    colors: Record<string, any>;
    borderRadius?: number;
    typography: Typography;
    elements: Record<string, Record<string, any> | StylesObject>;
    [key: string]: any;
}

export type DecoratedThemeStyles<T extends ThemeStyles> = T & {
    typography: { [K in keyof T["typography"]]: WithById<T[TypographyType][K]> };
};

export interface Theme {
    breakpoints: ThemeBreakpoints;
    styles: ThemeStyles;
}

export type DecoratedTheme = {
    breakpoints: ThemeBreakpoints;
    styles: DecoratedThemeStyles<ThemeStyles>;
};
