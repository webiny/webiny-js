import React from "react";
import { CSSObject } from "@emotion/css";

export interface Element {
    id: string;
    type: string;
    path: string[];
    data: Record<string, any>;
    elements: Element[];
}

export type Content = Element;

export interface ElementRendererProps {
    element: Element;
}

export type ElementRenderer = React.ComponentType<ElementRendererProps>;

export type ElementStylesModifier = (args: {
    element: Element;
    breakpointName: string;
    breakpoint: Breakpoint;
}) => CSSObject;

export interface Breakpoint {
    mediaQuery: string;
}

export interface Theme {
    breakpoints: Record<string, Breakpoint>;
    styles: Record<string, any>;
}
