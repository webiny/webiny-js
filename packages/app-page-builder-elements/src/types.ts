import React, { type CSSProperties } from "react";

/**
 * TODO @ts-refactor
 * We should have a single type for all page builder apps elements.
 * Currently we have Element, PbElement and PbEditorElement.
 */
export interface Element {
    id: string;
    type: string;
    data: {
        settings?: {
            grid?: {
                cellsType: string;
            };
            horizontalAlignFlex?: {
                [key: string]: string;
            };
            verticalAlign?: {
                [key: string]: string;
            };
            background?: {
                [key: string]: string;
            };
            border?: {
                [key: string]: {
                    style?: string;
                    color?: string;
                    radius?: {
                        advanced?: boolean;
                        top?: string;
                        bottom?: string;
                        left?: string;
                        right?: string;
                        all?: string;
                    };
                    width?: {
                        advanced?: boolean;
                        top?: string;
                        bottom?: string;
                        left?: string;
                        right?: string;
                        all?: string;
                    };
                };
            };
            shadow?: {
                horizontal?: string;
                vertical?: string;
                blur?: string;
                spread?: string;
                color?: string;
            };
            height?: {
                [key: string]: {
                    value: string;
                };
            };
            width?: {
                [key: string]: {
                    value: string;
                };
            };
            margin?: {
                [key: string]: {
                    advanced?: boolean;
                    top?: string;
                    bottom?: string;
                    left?: string;
                    right?: string;
                    all?: string;
                };
            };
            padding?: {
                [key: string]: {
                    advanced?: boolean;
                    top?: string;
                    bottom?: string;
                    left?: string;
                    right?: string;
                    all?: string;
                };
            };
            [key: string]: any;
        };
        text: {
            data: {
                text?: string;
                typography: string;
                color?: string;
                alignment?: CSSProperties["textAlign"];
                tag?: string;
            };
            desktop: {
                text?: string;
                typography: string;
                color?: string;
                alignment?: CSSProperties["textAlign"];
                tag?: string;
            };
            [key: string]: {
                text?: string;
                typography: string;
                color?: string;
                alignment?: CSSProperties["textAlign"];
                tag?: string;
            };
        };
        image: {
            file: {
                name: string;
                src: string;
            };
        };
        [key: string]: any;
    };
    elements: Element[];
    path?: string[];

    [key: string]: any;
}

export type Content = Element;

/**
 * Should be a `React.CSSProperties` object or an object with breakpoint names as keys and `React.CSSProperties` objects as values.
 */
export interface StylesObjects {
    [key: string]: React.CSSProperties | string | number | undefined;
}

export interface PageElementsProviderProps {
    theme: Theme;
    renderers?: Record<string, ElementRenderer>;
    modifiers: {
        styles: Record<string, ElementStylesModifier>;
    };
}

export type GetElementStyles = (element: Element) => Array<React.CSSProperties>;
export type GetThemeStyles = (
    getStyles: (theme: Theme) => StylesObjects
) => Array<React.CSSProperties>;
export type GetStyles = (styles: StylesObjects) => Array<React.CSSProperties>;

interface SetAssignStylesCallbackParams {
    breakpoints: Record<string, Breakpoint>;
    styles: StylesObjects;
    assignTo?: React.CSSProperties;
}

interface SetElementStylesCallbackParams extends PageElementsProviderProps {
    element: Element;
    assignStyles?: AssignStylesCallback;
}

interface SetThemeStylesCallbackParams extends PageElementsProviderProps {
    getStyles: (theme: Theme) => StylesObjects;
    assignStyles?: AssignStylesCallback;
}

interface SetStylesCallbackParams extends PageElementsProviderProps {
    styles: StylesObjects;
    assignStyles?: AssignStylesCallback;
}

export type AssignStylesCallback = (params: SetAssignStylesCallbackParams) => React.CSSProperties;
export type ElementStylesCallback = (
    params: SetElementStylesCallbackParams
) => Array<React.CSSProperties>;
export type ThemeStylesCallback = (
    params: SetThemeStylesCallbackParams
) => Array<React.CSSProperties>;
export type StylesCallback = (params: SetStylesCallbackParams) => Array<React.CSSProperties>;

export type SetAssignStylesCallback = (callback: AssignStylesCallback) => void;
export type SetElementStylesCallback = (callback: ElementStylesCallback) => void;
export type SetThemeStylesCallback = (callback: ThemeStylesCallback) => void;
export type SetStylesCallback = (callback: StylesCallback) => void;

export interface PageElementsContextValue extends PageElementsProviderProps {
    getElementStyles: GetElementStyles;
    getThemeStyles: GetThemeStyles;
    getStyles: GetStyles;
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
}) => StylesObjects | null;

export interface Breakpoint {
    mediaQuery: string;
}

export type ThemeBreakpoints = Record<string, Breakpoint>;

export interface ThemeStyles {
    colors?: Record<string, any>;
    borderRadius?: number;
    typography?: Record<string, StylesObjects>;
    buttons?: Record<string, StylesObjects>;

    [key: string]: any;
}

export interface Theme {
    breakpoints: ThemeBreakpoints;
    styles: ThemeStyles;
}
