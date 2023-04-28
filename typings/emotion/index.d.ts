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
export type TypographyType = "headings" | "paragraphs" | "quotes" | "lists" | string;
export type TypographyStyle = {
    id: string;
    name: string;
    tag: string;
    styles: CSSObject;
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
    stylesById: (id: string) => CSSObject | undefined;
};

export type DecoratedTypography = Record<TypographyType, DecoratedThemeTypographyStyles>;

interface DecoratedThemeStyles extends Omit<ThemeStyles, "typography"> {
    typography: DecoratedTypography;
}

export interface BaseTheme {
    breakpoints: ThemeBreakpoints;
    styles: ThemeStyles;
}

export interface Theme {
    breakpoints: ThemeBreakpoints;
    styles: DecoratedThemeStyles;
}

type WTheme = Theme;

declare module "@emotion/react" {
    // Ignoring "@typescript-eslint/no-empty-interface" rule here.
    // eslint-disable-next-line
    export interface Theme extends WTheme {}
}
