import React from "react";

export interface Element {
    id: string;
    type: string;
    data: ElementData;
    elements: Element[];
}

export interface ElementData {
    settings?: Record<string, any>;
    [key: string]: any;
}

export type Content = Element;

export interface Theme {
    [key: string]: any;
}

export interface DisplayMode {
    minWidth?: number;
    maxWidth?: number;
}

export type ElementComponent = React.ComponentType<ElementComponentProps>;

export interface ElementComponentProps {
    element: Element;
    getStyles: () => {};
}

export type ElementStylesHandler = (args: {
    element: Element;
    displayModeName: string;
    displayMode: DisplayMode;
}) => React.CSSProperties;

export type GetMediaQueryHandler = (args: {
    displayMode: Record<string, any>;
    displayModeName: string;
}) => string;
