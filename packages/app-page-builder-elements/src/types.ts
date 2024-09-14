import type { createRenderer } from "~/createRenderer";

export * from "@webiny/theme/types";

import React, { HTMLAttributes } from "react";
import { type CSSObject } from "@emotion/react";
import { StylesObject, ThemeBreakpoints, Theme } from "@webiny/theme/types";
import { ElementInputs, ElementInputValues } from "~/inputs/ElementInput";

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
    renderers: Record<string, DecoratableRenderer> | (() => Record<string, DecoratableRenderer>);
    modifiers: {
        styles: Record<string, ElementStylesModifier>;
        attributes: Record<string, ElementAttributesModifier>;
    };
    beforeRenderer?: React.ComponentType | null;
    afterRenderer?: React.ComponentType | null;
    children?: React.ReactNode;
}

export type AttributesObject = React.ComponentProps<any>;

export type GetRenderers = () => Record<string, DecoratableRenderer>;
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
    getRenderers: GetRenderers;
    getElementAttributes: GetElementAttributes;
    getElementStyles: GetElementStyles;
    getStyles: GetStyles;
    setAssignStylesCallback: SetAssignStylesCallback;
    setElementStylesCallback: SetElementStylesCallback;
    setStylesCallback: SetStylesCallback;
}

export type GetElement = <TElementData = Record<string, any>>() => Element<TElementData>;
export type GetAttributes = () => HTMLAttributes<HTMLElement>;

export interface RendererContextValue extends PageElementsContextValue {
    getElement: GetElement;
    getAttributes: GetAttributes;
    getInputValues: <TInputs extends ElementInputs>() => ElementInputValues<TInputs>;
    beforeRenderer: React.ComponentType | null;
    afterRenderer: React.ComponentType | null;
    meta: RendererProviderMeta;
}

export type RendererProviderMeta = {
    calculatedStyles: CSSObject[];
} & Record<string, any>;

export interface RendererProviderProps {
    element: Element;
    attributes: HTMLAttributes<HTMLElement>;
    meta: RendererProviderMeta;
    children: React.ReactNode;
}

export type RendererMeta = Record<string, any>;

export type RendererProps<TElement = Record<string, any>> = {
    element: Element<TElement>;
    meta?: RendererMeta;
};

export interface PageProviderProps {
    page: Page;
    layout?: React.ComponentType<{ children: React.ReactNode }>;
    layoutProps?: Record<string, any>;
    children: React.ReactNode;
}

export type Renderer<
    T = Record<string, any>,
    TElementData = Record<string, any>
> = React.FunctionComponent<RendererProps<TElementData> & T>;

// TODO: maybe call this `Renderer` but rename the base one to `BaseRenderer` ?
export type DecoratableRenderer = ReturnType<typeof createRenderer>;

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

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "ps-tag": {
                "data-key": string;
                "data-value": string;
            };
        }
    }
}
