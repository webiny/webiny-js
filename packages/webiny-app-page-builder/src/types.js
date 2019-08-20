// @flow
import type { Node, ComponentType } from "react";
import type { PluginType } from "webiny-plugins/types";
import type { WithPageDetailsProps } from "webiny-app-page-builder/admin/components";
import type { WithPageBuilderPropsType, PbProviderPropsType } from "webiny-app-page-builder/context";

export type { WithPageDetailsProps };
export type { WithPageBuilderPropsType };
export type { PbProviderPropsType };
export type { PluginType };

export type PbElementType = {
    id: string,
    path: string,
    type: string,
    elements: Array<Object>,
    data: Object
};

export type PbThemeType = {
    colors: Object,
    fonts: Object,
    elements: Object,
    styles: Object,
    plugins: Array<mixed>,
    layouts: Array<ComponentType<*>>
};

export type PbElementGroupPluginType = PluginType & {
    group: {
        // Title rendered in the toolbar.
        title: string,
        // Icon rendered in the toolbar.
        icon: Node
    }
};

export type PbElementPluginType = PluginType & {
    elementType: string,
    toolbar?: {
        // Element title in the toolbar.
        title?: string,
        // Element group this element belongs to.
        group?: string,
        // A function to render an element preview in the toolbar.
        preview?: () => Node
    },
    // Help link
    help?: string,
    // Array of element settings plugin names.
    settings?: Array<string>,
    // A function to create an element data structure.
    create: ({ options: Object }) => Object,
    // A function to render an element in the editor.
    render: ({ theme: PbThemeType, element: PbElementType }) => Node,
    // A function to check if an element can be deleted.
    canDelete?: ({ element: PbElementType }) => boolean,
    // Executed when another element is dropped on the drop zones of current element.
    onReceived?: ({
        store: Store,
        source: PbElementType | { type: string },
        target: PbElementType,
        position: number | null
    }) => void,
    // Executed when an immediate child element is deleted
    onChildDeleted?: ({ element: PbElementType, child: PbElementType }) => void
};

export type PbRenderElementPluginType = PluginType & {
    // Name of the pb-element plugin this render plugin is handling.
    element: string,
    render: ({ theme: PbThemeType, element: PbElementType }) => Node
};

export type PbPageDetailsPluginType = PluginType & {
    render: (params: WithPageDetailsProps) => Node
};

export type PbPageSettingsPluginType = PluginType & {
    /* Settings group title */
    title: string,
    /* Settings group description */
    description: string,
    /* Settings group icon */
    icon: Node,
    /* GraphQL query fields to include in the `settings` subselect */
    fields: string,
    /* Render function that handles the specified `fields` */
    render: (params: { Bind: ComponentType<*> }) => Node
};

export type PbBlockCategoryPluginType = PluginType & {
    title: string,
    description?: string
};

export type PbPageSettingsFieldsPluginType = PluginType & {
    fields: string
};

export type PbMenuItemPluginType = PluginType & {
    menuItem: {
        /* Item type (this will be stored to DB when menu is saved) */
        type: string,
        /* Menu item title */
        title: string,
        /* Menu item icon */
        icon: Node,
        /* Can other menu items become children of this item ? */
        canHaveChildren: boolean,
        /* Render function for menu item form */
        renderForm: (params: { data: Object, onSubmit: Function, onCancel: Function }) => Node
    }
};

export type PbElementActionPluginType = PluginType & {
    render: ({ plugin: PbElementPluginType }) => Node
};

export type PbRenderElementStylePluginType = PluginType & {
    renderStyle: ({ element: PbElementType, style: Object }) => Object
};

export type PbRenderElementAttributesPluginType = PluginType & {
    renderAttributes: ({ element: PbElementType, attributes: Object }) => Object
};

// ================= Redux types ===================
export type { Redux } from "webiny-app-page-builder/editor/redux";

export type Action = {
    type: string,
    payload: Object,
    meta: Object
};

export type ActionOptions = {
    log?: boolean
};

export type StatePath = null | string | ((action: Action) => string);

export type Reducer = Function;

export type ReducerFactory = () => Reducer;

export type Store = {
    dispatch: Function,
    getState: Function
};

export type State = Object & {
    elements: Object,
    page: Object,
    revisions: Array<Object>,
    ui: Object
};

export type MiddlewareParams = {
    store: Store,
    next: Function,
    action: Action
};

export type MiddlewareFunction = MiddlewareParams => any;
export type ActionCreator = (payload?: any, meta?: Object) => Action;
