import React, { HTMLAttributes } from "react";
import { type CSSObject } from "@emotion/core";
import { Theme, StylesObject, ThemeBreakpoints } from "@webiny/app-page-builder-theme/types";

export interface Page {
    id: string;
    path: string;
    content: Content;
    settings: Record<string, any>;
}

export type Content = Element;

export interface Element<TElementData = Record<string, any>> {
    id: string;
    type: string;
    data: TElementData;
    elements: Element[];
    path?: string[];
}

export interface PageElementsProviderProps {
    theme: Theme;
    renderers: Record<string, Renderer>;
    modifiers: {
        styles: Record<string, ElementStylesModifier>;
        attributes: Record<string, ElementAttributesModifier>;
    };
    beforeRenderer?: React.VFC | null;
    afterRenderer?: React.VFC | null;
}

export type AttributesObject = React.ComponentProps<any>;

export type GetElementAttributes = (element: Element) => AttributesObject;
export type GetElementStyles = (element: Element) => CSSObject;
export type GetStyles = (styles: StylesObject | ((theme: Theme) => StylesObject)) => CSSObject;

interface SetAssignAttributesCallbackParams {
    attributes: AttributesObject;
    assignTo?: AttributesObject;
}

interface SetAssignStylesCallbackParams {
    breakpoints: ThemeBreakpoints;
    styles: StylesObject;
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
    styles: StylesObject | ((theme: Theme) => StylesObject);
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

type GetElement = <TElementData = Record<string, any>>() => Element<TElementData>;
type GetAttributes = () => HTMLAttributes<HTMLElement>;

export interface RendererContextValue extends PageElementsContextValue {
    getElement: GetElement;
    getAttributes: GetAttributes;
    beforeRenderer: React.VFC | null;
    afterRenderer: React.VFC | null;
    meta: RendererProviderMeta;
}

export type RendererProviderMeta = {
    calculatedStyles: CSSObject[];
} & Record<string, any>;

export interface RendererProviderProps {
    element: Element;
    attributes: HTMLAttributes<HTMLElement>;
    meta: RendererProviderMeta;
}

export type RendererMeta = RendererProviderMeta;

export type RendererProps<TElement = Record<string, any>> = {
    element: Element<TElement>;
    meta?: RendererMeta
};

export interface PageProviderProps {
    page: Page;
    layout?: React.ComponentType<{ children: React.ReactNode }>;
    layoutProps?: Record<string, any>;
}

export type PageContextValue = {
    page: Page;
    layout?: React.ComponentType<{ children: React.ReactNode }>;
    layoutProps: Record<string, any>;
};

export type Renderer<T = {}, TElementData = Record<string, any>> = React.ComponentType<
    RendererProps<TElementData> & T
>;

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
}) => StylesObject | null;

export type LinkComponent = React.ComponentType<React.HTMLProps<HTMLAnchorElement>>;
