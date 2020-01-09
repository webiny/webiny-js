import { BindComponent } from "@webiny/form/Bind";

export * from "../types";

import { ComponentType, ReactElement, ReactNode } from "react";
import { Change, Value } from "slate";
import { Plugin as SlatePlugin, Editor } from "slate-react";
import { Reducer as ReduxReducer } from "redux";
import { Plugin } from "@webiny/app/types";
import { PbElement, PbTheme } from "../types";
import {
    PbPageDetailsContextValue,
    PbPageRevision
} from "../admin/contexts/PageDetails/PageDetailsContext";
import { IconPrefix, IconName } from "@fortawesome/fontawesome-svg-core";
import { MenuButtonProps } from "@webiny/app-page-builder/editor/components/Slate/Menu";
import { EditorBarProps } from "@webiny/app-page-builder/editor/components/Editor/Bar";
import { Form } from "@webiny/form/Form";

export type PbShallowElement = Omit<PbElement, "elements"> & { elements: string[] };

// ================= Redux types =================== //
export { Redux } from "@webiny/app-page-builder/editor/redux";

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

export type Store = {
    dispatch: Function;
    getState: Function;
};

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
    render(params: {
        pageDetails: PbPageDetailsContextValue;
        loading: boolean;
        refreshPages: () => void;
    }): ReactElement;
};

export type PbPageDetailsRevisionContentPreviewPlugin = PbPageDetailsRevisionContentPlugin;

export type PbMenuItemPlugin = Plugin & {
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

export type PbElementGroupPlugin = Plugin & {
    type: "pb-editor-page-element-group";
    group: {
        // Title rendered in the toolbar.
        title: string;
        // Icon rendered in the toolbar.
        icon: ReactElement;
    };
};

export type ElementTitle = (params: { refresh: () => void }) => ReactNode;

export type PbElementPlugin = Plugin & {
    type: "pb-page-element";
    elementType: string;
    toolbar?: {
        // Element title in the toolbar.
        title?: string | ElementTitle;
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

export type PbElementActionPlugin = Plugin & {
    render: (params: { plugin: PbElementPlugin }) => ReactNode;
};

export type PbPageDetailsPlugin = Plugin & {
    render: (params: { [key: string]: any }) => ReactNode;
};

export type PbPageSettingsPlugin = Plugin & {
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

export type PbBlockCategoryPlugin = Plugin & {
    title: string;
    description?: string;
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
        editor;
        activatePlugin;
    }): ReactElement;
    renderDialog?: (params: {
        onChange(change: Change): void;
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

export type PbEditorPageSettingsPlugin = Plugin & {
    type: "pb-editor-page-settings";
    title: string;
    description: string;
    icon: ReactElement;
    // GQL query string fields
    fields: string;
    render(props): ReactElement;
};

export type PbPageElementSettingsPlugin = Plugin & {
    type: "pb-page-element-settings";
    renderAction(params: { options?: any }): ReactElement;
    renderMenu?: (params: { options?: any }) => ReactElement;
};

export type PbPageElementAdvancedSettingsPlugin = Plugin & {
    type: "pb-page-element-advanced-settings";
    elementType: string;
    render(params?: { Bind: BindComponent; data: any }): ReactElement;
    onSave?: (data: FormData) => FormData;
};
