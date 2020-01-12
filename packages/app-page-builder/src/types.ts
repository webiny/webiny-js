import * as React from "react";
import { Plugin } from "@webiny/app/types";
import { ComponentType, ReactElement } from "react";
import { Plugin as SlatePlugin } from "slate-react";

export type PbElement = {
    id: string;
    path: string;
    type: string;
    elements: Array<PbElement>;
    data: { [key: string]: any };
    [key: string]: any;
};

export type PbTheme = {
    colors: { [key: string]: string };
    elements: { [key: string]: any };
    typography: {
        [key: string]: {
            label: string;
            component: string | React.ComponentType<any>;
            className: string;
        };
    };
};

export type PbThemePlugin = Plugin & {
    theme: PbTheme;
};

export type PbPageLayout = {
    name: string;
    title: string;
    component: React.ComponentType<any>;
};

export type PbPageLayoutPlugin = Plugin & {
    layout: PbPageLayout;
};

export type PbPageLayoutComponentPlugin = Plugin & {
    componentType: string;
    component: React.ComponentType<any>;
};

export type PbRenderElementPlugin = Plugin & {
    type: "pb-render-page-element";
    // Name of the pb-element plugin this render plugin is handling.
    elementType: string;
    render: (params: { theme: PbTheme; element: PbElement }) => React.ReactNode;
};

export type PbPageSettingsFieldsPlugin = Plugin & {
    fields: string;
};

export type PbRenderElementStylePlugin = Plugin & {
    renderStyle: (params: {
        element: { id: string; type: string; data: { [key: string]: any } };
        style: { [key: string]: any };
    }) => { [key: string]: any };
};

export type PbRenderElementAttributesPlugin = Plugin & {
    renderAttributes: (params: {
        element: { id: string; type: string; data: { [key: string]: any } };
        attributes: { [key: string]: string };
    }) => { [key: string]: string };
};

export type PbPageElementImagesListComponentPlugin = Plugin & {
    type: "pb-page-element-images-list-component";
    title: string;
    componentName: string;
    component: ComponentType<any>;
};

export type PbPageElementPagesListComponentPlugin = Plugin & {
    type: "pb-page-element-pages-list-component";
    title: string;
    componentName: string;
    component: ComponentType<any>;
};

export type PbRenderSlateEditorPlugin = Plugin & {
    type: "pb-render-slate-editor";
    slate: SlatePlugin;
};

export type PbAddonRenderPlugin = Plugin & {
    type: "addon-render";
    component: ReactElement;
};
