import React from "react";
import { CSSObject, cx } from "@emotion/css";

export interface Element {
    id: string;
    type: string;
    data: Record<string, any>;
    elements: Element[];
    path: string[]
    [key: string]: any;
}



export type Content = Element;

export type StylesObjects = Record<string, CSSObject> | CSSObject;

export interface PageElementsProviderProps {
    theme: Theme;
    renderers?: Record<string, ElementRenderer>;
    modifiers: {
        styles: Record<string, ElementStylesModifier>;
    };
}

export interface PageElementsContextValue extends PageElementsProviderProps {
    getElementStyles: (element: Element) => Array<CSSObject>;
    getElementClassNames: (element: Element) => Array<string>;
    getThemeStyles: (getStyles: (theme: Theme) => StylesObjects) => Array<CSSObject>;
    getThemeClassNames: (getStyles: (theme: Theme) => StylesObjects) => Array<string>;
    getStyles: (styles: StylesObjects) => Array<CSSObject>;
    getClassNames: (styles: StylesObjects) => Array<string>;
    combineClassNames: typeof cx;
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

export interface Theme {
    breakpoints: Record<string, Breakpoint>;
    styles: Record<string, any>;
}
