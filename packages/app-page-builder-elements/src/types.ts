import React, { HTMLAttributes } from "react";
import { type CSSObject } from "@emotion/react";

export type Content = Element;

/**
 * TODO @ts-refactor
 * We should have a single type for all page builder apps elements.
 * Currently, we have Element, PbElement and PbEditorElement.
 */
export interface Element<TData = any> {
    id: string;
    type: string;
    data: TData;
    // settings?: {
    //     grid?: {
    //         cellsType: string;
    //         size: string;
    //     };
    //     horizontalAlignFlex?: {
    //         [key: string]: string;
    //     };
    //     verticalAlign?: {
    //         [key: string]: string;
    //     };
    //     background?: {
    //         [key: string]: string;
    //     };
    //     border?: {
    //         [key: string]: {
    //             style?: string;
    //             color?: string;
    //             radius?: {
    //                 advanced?: boolean;
    //                 top?: string;
    //                 bottom?: string;
    //                 left?: string;
    //                 right?: string;
    //                 all?: string;
    //             };
    //             width?: {
    //                 advanced?: boolean;
    //                 top?: string;
    //                 bottom?: string;
    //                 left?: string;
    //                 right?: string;
    //                 all?: string;
    //             };
    //         };
    //     };
    //     shadow?: {
    //         horizontal?: string;
    //         vertical?: string;
    //         blur?: string;
    //         spread?: string;
    //         color?: string;
    //     };
    //     height?: {
    //         [key: string]: {
    //             value: string;
    //         };
    //     };
    //     width?: {
    //         [key: string]: {
    //             value: string;
    //         };
    //     };
    //     margin?: {
    //         [key: string]: {
    //             advanced?: boolean;
    //             top?: string;
    //             bottom?: string;
    //             left?: string;
    //             right?: string;
    //             all?: string;
    //         };
    //     };
    //     padding?: {
    //         [key: string]: {
    //             advanced?: boolean;
    //             top?: string;
    //             bottom?: string;
    //             left?: string;
    //             right?: string;
    //             all?: string;
    //         };
    //     };
    //     [key: string]: any;
    // };
    // text: {
    //     data: {
    //         text?: string;
    //         typography: string;
    //         color?: string;
    //         alignment?: CSSObject["textAlign"];
    //         tag?: string;
    //     };
    //     desktop: {
    //         text?: string;
    //         typography: string;
    //         color?: string;
    //         alignment?: CSSObject["textAlign"];
    //         tag?: string;
    //     };
    //     [key: string]: {
    //         text?: string;
    //         typography: string;
    //         color?: string;
    //         alignment?: CSSObject["textAlign"];
    //         tag?: string;
    //     };
    // };
    // image: {
    //     file: {
    //         name: string;
    //         src: string;
    //     };
    //     width: number;
    //     height: number;
    // };
    // [key: string]: any;
    elements: Element[];
    path?: string[];
}

/**
 * Should be a `CSSObject` object or an object with breakpoint names as keys and `CSSObject` objects as values.
 */
export interface StylesObjects {
    [key: string]: CSSObject | string | number | undefined;
}

export interface PageElementsProviderProps {
    theme: Theme;
    renderers: Record<string, Renderer>;
    modifiers: {
        styles: Record<string, ElementStylesModifier>;
        attributes: Record<string, ElementAttributesModifier>;
    };
}

export type AttributesObject = React.ComponentProps<any>;

export type GetElementAttributes = (element: Element) => AttributesObject;
export type GetElementStyles = (element: Element) => Array<CSSObject>;
export type GetThemeStyles = (getStyles: (theme: Theme) => StylesObjects) => Array<CSSObject>;
export type GetStyles = (styles: StylesObjects) => Array<CSSObject>;

interface SetAssignAttributesCallbackParams {
    attributes: AttributesObject;
    assignTo?: AttributesObject;
}

interface SetAssignStylesCallbackParams {
    breakpoints: Record<string, Breakpoint>;
    styles: StylesObjects;
    assignTo?: CSSObject;
}

interface SetElementAttributesCallbackParams extends PageElementsProviderProps {
    element: Element;
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

export type AssignAttributesCallback = (
    params: SetAssignAttributesCallbackParams
) => AttributesObject;
export type AssignStylesCallback = (params: SetAssignStylesCallbackParams) => CSSObject;
export type ElementAttributesCallback = (
    params: SetElementAttributesCallbackParams
) => AttributesObject;
export type ElementStylesCallback = (params: SetElementStylesCallbackParams) => Array<CSSObject>;
export type ThemeStylesCallback = (params: SetThemeStylesCallbackParams) => Array<CSSObject>;
export type StylesCallback = (params: SetStylesCallbackParams) => Array<CSSObject>;

export type SetAssignStylesCallback = (callback: AssignStylesCallback) => void;
export type SetElementStylesCallback = (callback: ElementStylesCallback) => void;
export type SetThemeStylesCallback = (callback: ThemeStylesCallback) => void;
export type SetStylesCallback = (callback: StylesCallback) => void;

export interface PageElementsContextValue extends PageElementsProviderProps {
    getElementAttributes: GetElementAttributes;
    getElementStyles: GetElementStyles;
    getThemeStyles: GetThemeStyles;
    getStyles: GetStyles;
    setAssignStylesCallback: SetAssignStylesCallback;
    setElementStylesCallback: SetElementStylesCallback;
    setThemeStylesCallback: SetThemeStylesCallback;
    setStylesCallback: SetStylesCallback;
}

export interface RendererContextValue extends PageElementsContextValue {
    getElement: () => Element;
    getAttributes: () => HTMLAttributes<HTMLElement>;
}

export interface RendererProviderProps {
    element: Element;
    attributes: HTMLAttributes<HTMLElement>;
}

export type ElementRendererProps = {
    element: Element;
};

export type Renderer<T = {}> = React.ComponentType<ElementRendererProps & T>;

export type ElementAttributesModifier = (args: {
    element: Element;
    theme: Theme;
    renderers?: PageElementsProviderProps["renderers"];
    modifiers?: PageElementsProviderProps["modifiers"];
}) => AttributesObject | null;

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
    colors: Record<string, any>;
    borderRadius?: number;
    typography: Record<string, StylesObjects>;
    elements: Record<string, Record<string,any> | StylesObjects>;

    [key: string]: any;
}

export interface Theme {
    breakpoints: ThemeBreakpoints;
    styles: ThemeStyles;
}

export type LinkComponent = React.ComponentType<React.HTMLProps<HTMLAnchorElement>>;
