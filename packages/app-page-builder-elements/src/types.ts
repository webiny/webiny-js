import React from "react";
import { CSSObject, cx } from "@emotion/css";

export interface Element {
    id: string;
    type: string;
    data: Record<string, any>;
    elements: Element[];
    path?: string[];
    [key: string]: any;
}

export type Content = Element;

/**
 * Should be a `CSSObject` object or an object with breakpoint names as keys and `CSSObject` objects as values.
 */
export type StylesObjects = Record<string, any>; // TODO: CSSObject | Record<string, CSSObject>; doesn't work?

export interface PageElementsProviderProps {
    theme: Theme;
    renderers?: Record<string, ElementRenderer>;
    modifiers: {
        styles: Record<string, ElementStylesModifier>;
    };
}

export type GetElementStyles = (element: Element) => Array<CSSObject>;
export type GetElementClassNames = (element: Element) => Array<string>;
export type GetThemeStyles = (getStyles: (theme: Theme) => StylesObjects) => Array<CSSObject>;
export type GetThemeClassNames = (getStyles: (theme: Theme) => StylesObjects) => Array<string>;
export type GetStyles = (styles: StylesObjects) => Array<CSSObject>;
export type GetClassNames = (styles: StylesObjects) => Array<string>;

type SetAssignStylesCallbackParams = {
    breakpoints: Record<string, Breakpoint>;
    styles: StylesObjects;
    assignTo?: CSSObject;
};

type SetElementStylesCallbackParams = PageElementsProviderProps & {
    element: Element;
    assignStyles?: AssignStylesCallback;
};
type SetThemeStylesCallbackParams = PageElementsProviderProps & {
    getStyles: (theme: Theme) => StylesObjects;
    assignStyles?: AssignStylesCallback;
};
type SetStylesCallbackParams = PageElementsProviderProps & {
    styles: StylesObjects;
    assignStyles?: AssignStylesCallback;
};

export type AssignStylesCallback = (params: SetAssignStylesCallbackParams) => CSSObject;
export type ElementStylesCallback = (params: SetElementStylesCallbackParams) => Array<CSSObject>;
export type ThemeStylesCallback = (params: SetThemeStylesCallbackParams) => Array<CSSObject>;
export type StylesCallback = (params: SetStylesCallbackParams) => Array<CSSObject>;

export type SetAssignStylesCallback = (callback: AssignStylesCallback) => void;
export type SetElementStylesCallback = (callback: ElementStylesCallback) => void;
export type SetThemeStylesCallback = (callback: ThemeStylesCallback) => void;
export type SetStylesCallback = (callback: StylesCallback) => void;

export interface PageElementsContextValue extends PageElementsProviderProps {
    getElementStyles: GetElementStyles;
    getElementClassNames: GetElementClassNames;
    getThemeStyles: GetThemeStyles;
    getThemeClassNames: GetThemeClassNames;
    getStyles: GetStyles;
    getClassNames: GetClassNames;
    combineClassNames: typeof cx;
    setAssignStylesCallback: SetAssignStylesCallback;
    setElementStylesCallback: SetElementStylesCallback;
    setThemeStylesCallback: SetThemeStylesCallback;
    setStylesCallback: SetStylesCallback;
}

export interface ElementRendererProps {
    element: Element;
}

export type ElementRenderer<T extends ElementRendererProps = ElementRendererProps> =
    React.ComponentType<T>;

export type ElementStylesModifier = (args: {
    element: Element;
    theme: Theme;
    renderers?: PageElementsProviderProps["renderers"];
    modifiers?: PageElementsProviderProps["modifiers"];
}) => StylesObjects;

export interface Breakpoint {
    mediaQuery: string;
}

export type ThemeBreakpoints = Record<string, Breakpoint>;

export interface ThemeStyles {
    colors?: Record<string, any>;
    typography?: Record<string, StylesObjects>;
    [key: string]: any;
}

export interface Theme {
    breakpoints?: ThemeBreakpoints;
    styles?: ThemeStyles;
}
