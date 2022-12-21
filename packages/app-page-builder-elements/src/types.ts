import React, {HTMLAttributes} from "react";
import {type CSSObject} from "@emotion/core";
import {Theme, Breakpoint, StylesObject} from "@webiny/app-page-builder-theme/types";

export type Content = Element;

/**
 * TODO @ts-refactor
 * We should have a single type for all page builder apps elements.
 * Currently, we have Element, PbElement and PbEditorElement.
 */
export interface Element<TElementData = Record<string, any>> {
    id: string;
    type: string;
    data: TElementData;
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
export interface Stylesobject {
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
export type GetElementStyles = (element: Element) => CSSObject;
export type GetStyles = (
    styles: StylesObject | ((theme: Theme) => Stylesobject)
) => CSSObject;

interface SetAssignAttributesCallbackParams {
    attributes: AttributesObject;
    assignTo?: AttributesObject;
}

interface SetAssignStylesCallbackParams {
    breakpoints: Record<string, Breakpoint>;
    styles: Stylesobject;
    assignTo?: CSSObject;
}

interface SetElementAttributesCallbackParams extends PageElementsProviderProps {
    element: Element;
}

interface SetElementStylesCallbackParams extends PageElementsProviderProps {
    element: Element;
    assignStyles?: AssignStylesCallback;
}

interface SetStylesCallbackParams extends PageElementsProviderProps {
    styles: StylesObject | ((theme: Theme) => Stylesobject);
    assignStyles?: AssignStylesCallback;
}

export type AssignAttributesCallback = (
    params: SetAssignAttributesCallbackParams
) => AttributesObject;
export type AssignStylesCallback = (params: SetAssignStylesCallbackParams) => CSSObject;
export type ElementAttributesCallback = (
    params: SetElementAttributesCallbackParams
) => AttributesObject;
export type ElementStylesCallback = (params: SetElementStylesCallbackParams) => CSSObject;
export type StylesCallback = (params: SetStylesCallbackParams) => CSSObject;

export type SetAssignStylesCallback = (callback: AssignStylesCallback) => void;
export type SetElementStylesCallback = (callback: ElementStylesCallback) => void;
export type SetStylesCallback = (callback: StylesCallback) => void;

export interface PageElementsContextValue extends PageElementsProviderProps {
    getElementAttributes: GetElementAttributes;
    getElementStyles: GetElementStyles;
    getStyles: GetStyles;
    setAssignStylesCallback: SetAssignStylesCallback;
    setElementStylesCallback: SetElementStylesCallback;
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

export type ElementRendererProps<TElement = Record<string, any>> = {
    element: Element<TElement>;
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
}) => Stylesobject | null;

export type LinkComponent = React.ComponentType<React.HTMLProps<HTMLAnchorElement>>;
