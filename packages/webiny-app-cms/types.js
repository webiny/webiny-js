import type { Node, ComponentType } from "react";
import type { Store } from "webiny-app/redux";
import type { PluginType } from "webiny-app/plugins";
import type { WithPageDetailsProps } from "webiny-app-cms/admin/components";

export { WithPageDetailsProps };

// TODO: @pavel
export type SearchBarPluginType = {
    name: string,
    type: string,
    labels: {
        option: string,
        search: string
    },
    renderFilters?: ({ Bind: ComponentType<*> }) => Node,
    onSearch?: (data: Object) => void
};

export type ElementType = {
    id: string,
    path: string,
    type: string,
    elements: Array<ElementType>,
    data: Object,
    settings: Object
};

export type CmsThemeType = {
    colors: Object,
    fonts: Object,
    elements: Object,
    styles: Object,
    plugins: Array<mixed>,
    layouts: Array<ComponentType<*>>
};

export type ElementGroupPluginType = PluginType & {
    group: {
        // Group name used by element plugins.
        name: string,
        // Title rendered in the toolbar.
        title: string,
        // Icon rendered in the toolbar.
        icon: Node
    }
};

export type ElementPluginType = PluginType & {
    toolbar: {
        // Element name (used by the editor).
        name: string,
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
    render: ({ theme: CmsThemeType, element: ElementType }) => Node,
    // A function to check if an element can be deleted.
    canDelete: ({ parent, element}) => boolean,
    // Executed when another element is dropped on the drop zones of current element.
    onReceived?: ({
        store: Store,
        source: ElementType | { type: string },
        target: ElementType,
        position: Number | null
    }) => void,
    // Executed when an immediate child element is deleted
    onChildDeleted?: ({ element: ElementType, child: ElementType }) => void
};

export type RenderElementPluginType = PluginType & {
    // Name of the cms-element plugin this render plugin is handling.
    element: string,
    render: ({ theme: CmsThemeType, element: ElementType }) => Node
};

export type CmsPageDetailsPluginType = PluginType &  {
    render: (params: WithPageDetailsProps) => Node
};

export type CmsPageSettingsPluginType = PluginType & {
    /* Settings group title */
    title: string,
    /* Settings group description */
    description: string,
    /* Settings group icon */
    icon: Node,
    /* GraphQL query fields to include in the `settings` subselect */
    fields: string,
    /* Render function that handles the specified `fields` */
    render: (params: { Bind: ComponentType<*>}) => Node
};

export type CmsMenuItemPluginType = PluginType & {
    /* Menu item title */
    title: string,
    /* Menu item icon */
    icon: Node,
    /* Can other menu items become children of this item ? */
    canHaveChildren: boolean,
    /* Render function for menu item form */
    renderForm: (params: { data: Object, onSubmit: Function, onCancel: Function }) => Node
};

// ================= Redux types ===================
export type { Redux } from "webiny-app-cms/editor/redux";

export type Action = {
    type: string,
    payload: Object
};

export type ActionOptions = {
    log?: boolean
};

export type StatePath = null | string | (action: Action) => string;

export type Reducer = Function;

export type ReducerFactory = () => Reducer;

export type Store = {
    dispatch: Function,
    getState: Function
};

export type State = Object;

export type MiddlewareParams = {
    store: Store,
    next: Function,
    action: Action
};

export type MiddlewareFunction = MiddlewareParams => any;
export type ActionCreator = (payload?: Object) => Action;
