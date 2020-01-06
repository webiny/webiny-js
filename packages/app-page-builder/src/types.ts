import * as React from "react";
import { Plugin } from "@webiny/app/types";

// ================= Redux types =================== //
export { Redux } from "@webiny/app-page-builder/editor/redux";

export type Action = {
    type: string;
    payload: Object;
    meta: Object;
};

export type ActionOptions = {
    log?: boolean;
};

export type StatePath = null | string | ((action: Action) => string);

export type Reducer = Function;

export type ReducerFactory = () => Reducer;

export type Store = {
    dispatch: Function;
    getState: Function;
};

export type State = Object & {
    elements: Object;
    page: Object;
    revisions: Array<Object>;
    ui: Object;
};

export type MiddlewareParams = {
    store: Store;
    next: Function;
    action: Action;
};

export type MiddlewareFunction = (params: MiddlewareParams) => any;
export type ActionCreator = (payload?: any, meta?: Object) => Action;

// ================= PB types =================== //

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

export type PbPageLayoutPlugin = Plugin & {
    layout: {
        name: string;
        title: string;
        component: React.ComponentType<any>;
    };
};

export type PbPageLayoutComponentPlugin = Plugin & {
    componentType: string;
    component: React.ComponentType<any>;
};

export type PbRenderElementPlugin = Plugin & {
    // Name of the pb-element plugin this render plugin is handling.
    elementType: string;
    render: (params: { theme: PbTheme; element: PbElement }) => React.ReactElement;
};

export type PbPageSettingsFieldsPlugin = Plugin & {
    fields: string;
};

export type PbRenderElementStylePlugin = Plugin & {
    renderStyle: (params: {
        element: PbElement;
        style: { [key: string]: any };
    }) => { [key: string]: any };
};

export type PbRenderElementAttributesPlugin = Plugin & {
    renderAttributes: (params: {
        element: PbElement;
        attributes: { [key: string]: string };
    }) => { [key: string]: string };
};
