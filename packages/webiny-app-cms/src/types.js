// @flow
import type { Node, ComponentType } from "react";
import type { PluginType } from "webiny-plugins/types";
import type { WithPageDetailsProps } from "webiny-app-cms/admin/components";
import type { WithPageBuilderPropsType, PageBuilderProviderPropsType } from "webiny-app-cms/context";

export type { WithPageDetailsProps };
export type { WithPageBuilderPropsType };
export type { PageBuilderProviderPropsType };
export type { PluginType };

export type ElementType = {
    id: string,
    path: string,
    type: string,
    elements: Array<Object>,
    data: Object
};

export type PageBuilderThemeType = {
    colors: Object,
    fonts: Object,
    elements: Object,
    styles: Object,
    plugins: Array<mixed>,
    layouts: Array<ComponentType<*>>
};

export type ElementGroupPluginType = PluginType & {
    group: {
        // Title rendered in the toolbar.
        title: string,
        // Icon rendered in the toolbar.
        icon: Node
    }
};

export type ElementPluginType = PluginType & {
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
    render: ({ theme: PageBuilderThemeType, element: ElementType }) => Node,
    // A function to check if an element can be deleted.
    canDelete?: ({ element: ElementType }) => boolean,
    // Executed when another element is dropped on the drop zones of current element.
    onReceived?: ({
        store: Store,
        source: ElementType | { type: string },
        target: ElementType,
        position: number | null
    }) => void,
    // Executed when an immediate child element is deleted
    onChildDeleted?: ({ element: ElementType, child: ElementType }) => void
};

export type RenderElementPluginType = PluginType & {
    // Name of the pb-element plugin this render plugin is handling.
    element: string,
    render: ({ theme: PageBuilderThemeType, element: ElementType }) => Node
};

export type PageBuilderPageDetailsPluginType = PluginType & {
    render: (params: WithPageDetailsProps) => Node
};

export type PageBuilderPageSettingsPluginType = PluginType & {
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

export type PageBuilderBlockCategoryPluginType = PluginType & {
    title: string,
    description?: string
};

export type PageBuilderPageSettingsFieldsPluginType = PluginType & {
    fields: string
};

export type PageBuilderMenuItemPluginType = PluginType & {
    /* Menu item title */
    title: string,
    /* Menu item icon */
    icon: Node,
    /* Can other menu items become children of this item ? */
    canHaveChildren: boolean,
    /* Render function for menu item form */
    renderForm: (params: { data: Object, onSubmit: Function, onCancel: Function }) => Node
};

export type PageBuilderElementActionPluginType = PluginType & {
    render: ({ plugin: ElementPluginType }) => Node
};

export type PageBuilderRenderElementStylePluginType = PluginType & {
    renderStyle: ({ element: ElementType, style: Object }) => Object
};

export type PageBuilderRenderElementAttributesPluginType = PluginType & {
    renderAttributes: ({ element: ElementType, attributes: Object }) => Object
};

// ================= Redux types ===================
export type { Redux } from "webiny-app-cms/editor/redux";

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
