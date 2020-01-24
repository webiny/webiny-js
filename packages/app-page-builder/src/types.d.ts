import * as React from "react";
import { Plugin } from "@webiny/app/types";
import { ComponentType, ReactElement } from "react";
import { Plugin as SlatePlugin } from "slate-react";
export declare type PbElement = {
    id: string;
    path: string;
    type: string;
    elements: Array<PbElement>;
    data: {
        [key: string]: any;
    };
    [key: string]: any;
};
export declare type PbTheme = {
    colors: {
        [key: string]: string;
    };
    elements: {
        [key: string]: any;
    };
    typography: {
        [key: string]: {
            label: string;
            component: string | React.ComponentType<any>;
            className: string;
        };
    };
};
export declare type PbThemePlugin = Plugin & {
    theme: PbTheme;
};
export declare type PbPageLayout = {
    name: string;
    title: string;
    component: React.ComponentType<any>;
};
export declare type PbPageLayoutPlugin = Plugin & {
    layout: PbPageLayout;
};
export declare type PbPageLayoutComponentPlugin = Plugin & {
    componentType: string;
    component: React.ComponentType<any>;
};
export declare type PbRenderElementPlugin = Plugin & {
    type: "pb-render-page-element";
    elementType: string;
    render: (params: {
        theme: PbTheme;
        element: PbElement;
    }) => React.ReactNode;
};
export declare type PbPageSettingsFieldsPlugin = Plugin & {
    fields: string;
};
export declare type PbRenderElementStylePlugin = Plugin & {
    renderStyle: (params: {
        element: {
            id: string;
            type: string;
            data: {
                [key: string]: any;
            };
        };
        style: {
            [key: string]: any;
        };
    }) => {
        [key: string]: any;
    };
};
export declare type PbRenderElementAttributesPlugin = Plugin & {
    renderAttributes: (params: {
        element: {
            id: string;
            type: string;
            data: {
                [key: string]: any;
            };
        };
        attributes: {
            [key: string]: string;
        };
    }) => {
        [key: string]: string;
    };
};
export declare type PbPageElementImagesListComponentPlugin = Plugin & {
    type: "pb-page-element-images-list-component";
    title: string;
    componentName: string;
    component: ComponentType<any>;
};
export declare type PbPageElementPagesListComponentPlugin = Plugin & {
    type: "pb-page-element-pages-list-component";
    title: string;
    componentName: string;
    component: ComponentType<any>;
};
export declare type PbRenderSlateEditorPlugin = Plugin & {
    type: "pb-render-slate-editor";
    slate: SlatePlugin;
};
export declare type PbAddonRenderPlugin = Plugin & {
    type: "addon-render";
    component: ReactElement;
};
