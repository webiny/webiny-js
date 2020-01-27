import { ComponentType, ReactElement, ReactNode } from "react";
import { Value } from "slate";
import { Plugin as SlatePlugin, Editor } from "slate-react";
import { Plugin } from "@webiny/app/types";
import { BindComponent } from "@webiny/form/Bind";
import { Reducer as ReduxReducer, Store as ReduxStore } from "redux";
import {
    PbPageDetailsContextValue,
    PbPageRevision
} from "./admin/contexts/PageDetails/PageDetailsContext";
import { IconPrefix, IconName } from "@fortawesome/fontawesome-svg-core";
import { MenuButtonProps } from "@webiny/app-page-builder/editor/components/Slate/Menu";
import { EditorBarProps } from "@webiny/app-page-builder/editor/components/Editor/Bar";
import { Form } from "@webiny/form/Form";
export { Redux } from "@webiny/app-page-builder/editor/redux";

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

export type PbShallowElement = Omit<PbElement, "elements"> & { elements: string[] };

export type Action = {
    type: string;
    payload: { [key: string]: any };
    meta: { [key: string]: any };
};

export type ActionOptions = {
    log?: boolean;
};

export type StatePathGetter = (action: Action) => string;

export type StatePath = null | string | StatePathGetter;
export type Reducer = ReduxReducer;

export type ReducerFactory = () => Reducer;

export type Store = ReduxStore;

export type State = {
    elements?: { [key: string]: PbShallowElement };
    page?: { [key: string]: any };
    revisions?: Array<{ [key: string]: any }>;
    ui?: { [key: string]: any };
};

export type MiddlewareParams = {
    store: Store;
    next: Function;
    action: Action;
};

export type MiddlewareFunction = (params: MiddlewareParams) => any;
export type ActionCreator = (payload?: any, meta?: { [key: string]: any }) => Action;

export type PbEditorReduxMiddlewarePlugin = Plugin & {
    type: "pb-editor-redux-middleware";
    actions: string[];
    middleware: MiddlewareFunction;
};

export { PbPageDetailsContextValue, PbPageRevision };

export type PbDocumentElementPlugin = Plugin & {
    elementType: "document";
    create(options?: any): PbElement;
    render(props): ReactElement;
};

export type PbPageDetailsRevisionContentPlugin = Plugin & {
    type: "pb-page-details-revision-content";
    render(params: {
        pageDetails: PbPageDetailsContextValue;
        loading: boolean;
        refreshPages: () => void;
    }): ReactElement;
};

export type PbPageDetailsHeaderRightOptionsMenuItemPlugin = Plugin & {
    type: "pb-page-details-header-right-options-menu-item";
    render(props: any): ReactElement;
};

export type PbPageDetailsRevisionContentPreviewPlugin = Plugin & {
    type: "pb-page-details-revision-content-preview";
    render(params: {
        pageDetails: PbPageDetailsContextValue;
        loading: boolean;
        refreshPages: () => void;
    }): ReactElement;
};

export type PbMenuItemPlugin = Plugin & {
    type: "pb-menu-item";
    menuItem: {
        /* Item type (this will be stored to DB when menu is saved) */
        type: string;
        /* Menu item title */
        title: string;
        /* Menu item icon */
        icon: ReactElement;
        /* Can other menu items become children of this item ? */
        canHaveChildren: boolean;
        /* Render function for menu item form */
        renderForm: (params: {
            data: { [key: string]: any };
            onSubmit: Function;
            onCancel: Function;
        }) => ReactElement;
    };
};

export type PbEditorPageElementGroupPlugin = Plugin & {
    type: "pb-editor-page-element-group";
    group: {
        // Title rendered in the toolbar.
        title: string;
        // Icon rendered in the toolbar.
        icon: ReactElement;
    };
};

export type PbEditorPageElementTitle = (params: { refresh: () => void }) => ReactNode;

export type PbEditorPageElementPlugin = Plugin & {
    type: "pb-editor-page-element";
    elementType: string;
    toolbar?: {
        // Element title in the toolbar.
        title?: string | PbEditorPageElementTitle;
        // Element group this element belongs to.
        group?: string;
        // A function to render an element preview in the toolbar.
        preview?: ({ theme: PbTheme }) => ReactNode;
    };
    // Help link
    help?: string;
    // Whitelist elements that can accept this element (for drag&drop interaction)
    target?: string[];
    // Array of element settings plugin names.
    settings?: Array<string>;
    // A function to create an element data structure.
    create: (options: { [key: string]: any }, parent?: PbElement) => Omit<PbElement, "id" | "path">;
    // A function to render an element in the editor.
    render: (params: { theme?: PbTheme; element: PbElement }) => ReactNode;
    // A function to check if an element can be deleted.
    canDelete?: (params: { element: PbElement }) => boolean;
    // Executed when another element is dropped on the drop zones of current element.
    onReceived?: (params: {
        store?: Store;
        source: PbElement | { type: string; path?: string };
        target: PbElement;
        position: number | null;
    }) => void;
    // Executed when an immediate child element is deleted
    onChildDeleted?: (params: { element: PbElement; child: PbElement }) => void;
    // Executed after element was created
    onCreate?: string;
    // Render element preview (used when creating element screenshots; not all elements have a simple DOM representation
    // so this callback is used to customize the look of the element in a PNG image)
    renderElementPreview?: (params: {
        element: PbElement;
        width: number;
        height: number;
    }) => ReactElement;
};

export type PbEditorPageElementActionPlugin = Plugin & {
    type: "pb-editor-page-element-action";
    render: (params: { plugin: PbEditorPageElementPlugin }) => ReactNode;
};

export type PbPageDetailsPlugin = Plugin & {
    render: (params: { [key: string]: any }) => ReactNode;
};

export type PbEditorPageSettingsPlugin = Plugin & {
    type: "pb-editor-page-settings";
    /* Settings group title */
    title: string;
    /* Settings group description */
    description: string;
    /* Settings group icon */
    icon: ReactNode;
    /* GraphQL query fields to include in the `settings` subselect */
    fields: string;
    /* Render function that handles the specified `fields` */
    render: (params: { form: Form; Bind: BindComponent }) => ReactNode;
};

export type PbIcon = {
    /**
     * [ pack, icon ], ex: ["fab", "cog"]
     */
    id: [IconPrefix, IconName];
    /**
     * Icon name
     */
    name: string;
    /**
     * SVG element
     */
    svg: ReactElement;
};

export type PbIconsPlugin = Plugin & {
    type: "pb-icons";
    getIcons(): PbIcon[];
};

export type PbEditorSlateEditorPlugin = Plugin & {
    type: "pb-editor-slate-editor";
    slate: SlatePlugin;
};

export type PbEditorSlateMenuItemPlugin = Plugin & {
    type: "pb-editor-slate-menu-item";
    render(params: {
        MenuButton: ComponentType<MenuButtonProps>;
        value: Value;
        onChange;
        editor: Editor;
        activatePlugin;
    }): ReactElement;
    renderDialog?: (params: {
        onChange(change: Editor): void;
        editor: Editor;
        open: boolean;
        closeDialog(): void;
        activePlugin: {
            plugin: string;
            value: { [key: string]: any };
        };
        activatePlugin(name: string): void;
    }) => ReactElement;
};

export type PbEditorBarPlugin = Plugin & {
    type: "pb-editor-bar";
    shouldRender(props: EditorBarProps): boolean;
    render(): ReactElement;
};

export type PbEditorContentPlugin = Plugin & {
    type: "pb-editor-content";
    render(): ReactElement;
};

export type PbEditorDefaultBarLeftPlugin = Plugin & {
    type: "pb-editor-default-bar-left";
    render(): ReactElement;
};

export type PbEditorDefaultBarRightPlugin = Plugin & {
    type: "pb-editor-default-bar-right";
    render(): ReactElement;
};

export type PbEditorDefaultBarRightPageOptionsPlugin = Plugin & {
    type: "pb-editor-default-bar-right-page-options";
    render(): ReactElement;
};

export type PbEditorToolbarTopPlugin = Plugin & {
    type: "pb-editor-toolbar-top";
    renderAction(): ReactElement;
    renderDialog?: () => ReactElement;
    renderDrawer?: () => ReactElement;
};

export type PbEditorToolbarBottomPlugin = Plugin & {
    type: "pb-editor-toolbar-bottom";
    renderAction(): ReactElement;
    renderDialog?: () => ReactElement;
};

export type PbEditorBlockPlugin = Plugin & {
    type: "pb-editor-block";
    title: string;
    category: string;
    tags: string[];
    image: {
        src?: string;
        meta: {
            width: number;
            height: number;
            aspectRatio: number;
        };
    };
    create(): PbElement;
    preview(): ReactElement;
};

export type PbEditorBlockCategoryPlugin = Plugin & {
    type: "pb-editor-block-category";
    title: string;
    categoryName: string;
    description: string;
    icon: ReactElement;
};

export type PbEditorPageElementSettingsPlugin = Plugin & {
    type: "pb-editor-page-element-settings";
    renderAction(params: { options?: any }): ReactElement;
    renderMenu?: (params: { options?: any }) => ReactElement;
};

export type PbEditorPageElementAdvancedSettingsPlugin = Plugin & {
    type: "pb-editor-page-element-advanced-settings";
    elementType: string;
    render(params?: { Bind: BindComponent; data: any }): ReactElement;
    onSave?: (data: FormData) => FormData;
};
