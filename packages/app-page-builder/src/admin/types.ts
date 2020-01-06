import * as React from "react";

export * from "../types";

import { Plugin } from "@webiny/app/types";

import { PbElement, PbTheme, Store } from "../types";

import {
    PbPageDetailsContextValue,
    PbPageRevision
} from "../admin/contexts/PageDetails/PageDetailsContext";

export { PbPageDetailsContextValue, PbPageRevision };

export type PbDocumentElementPlugin = Plugin & {
    elementType: "document";
    create(options?: any): PbElement;
    render(props): React.ReactElement;
};

export type PbPageDetailsRevisionContentPlugin = Plugin & {
    render(params: {
        pageDetails: PbPageDetailsContextValue;
        loading: boolean;
        refreshPages: () => void;
    }): React.ReactElement;
};

export type PbPageDetailsRevisionContentPreviewPlugin = PbPageDetailsRevisionContentPlugin;

export type PbMenuItemPlugin = Plugin & {
    menuItem: {
        /* Item type (this will be stored to DB when menu is saved) */
        type: string;
        /* Menu item title */
        title: string;
        /* Menu item icon */
        icon: React.ReactElement;
        /* Can other menu items become children of this item ? */
        canHaveChildren: boolean;
        /* Render function for menu item form */
        renderForm: (params: {
            data: { [key: string]: any };
            onSubmit: Function;
            onCancel: Function;
        }) => React.ReactElement;
    };
};

export type PbElementGroupPlugin = Plugin & {
    group: {
        // Title rendered in the toolbar.
        title: string;
        // Icon rendered in the toolbar.
        icon: React.ReactNode;
    };
};

export type PbElementPlugin = Plugin & {
    elementType: string;
    toolbar?: {
        // Element title in the toolbar.
        title?: string;
        // Element group this element belongs to.
        group?: string;
        // A function to render an element preview in the toolbar.
        preview?: () => React.ReactNode;
    };
    // Help link
    help?: string;
    // Whitelist elements that can accept this element (for drag&drop interaction)
    target?: string[];
    // Array of element settings plugin names.
    settings?: Array<string>;
    // A function to create an element data structure.
    create: (options: { [key: string]: any }, parent?: PbElement) => PbElement;
    // A function to render an element in the editor.
    render: (params: { theme: PbTheme; element: PbElement }) => React.ReactNode;
    // A function to check if an element can be deleted.
    canDelete?: (params: { element: PbElement }) => boolean;
    // Executed when another element is dropped on the drop zones of current element.
    onReceived?: (params: {
        store?: Store;
        source: PbElement | { type: string };
        target: PbElement;
        position: number | null;
    }) => void;
    // Executed when an immediate child element is deleted
    onChildDeleted?: (params: { element: PbElement; child: PbElement }) => void;
};

export type PbBlockPlugin = PbElementPlugin;

export type PbElementActionPlugin = Plugin & {
    render: (params: { plugin: PbElementPlugin }) => React.ReactNode;
};

export type PbPageDetailsPlugin = Plugin & {
    render: (params: { [key: string]: any }) => React.ReactNode;
};

export type PbPageSettingsPlugin = Plugin & {
    /* Settings group title */
    title: string;
    /* Settings group description */
    description: string;
    /* Settings group icon */
    icon: React.ReactNode;
    /* GraphQL query fields to include in the `settings` subselect */
    fields: string;
    /* Render function that handles the specified `fields` */
    render: (params: { Bind: React.ComponentType }) => React.ReactNode;
};

export type PbBlockCategoryPlugin = Plugin & {
    title: string;
    description?: string;
};
