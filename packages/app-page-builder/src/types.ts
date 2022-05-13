import React, { ComponentType, ReactElement, ReactNode } from "react";
import { DragObjectWithTypeWithTarget } from "./editor/components/Droppable";
import { BaseEventAction, EventAction } from "./editor/recoil/eventActions";
import { PluginsAtomType } from "./editor/recoil/modules";
import { PbState } from "./editor/recoil/modules/types";
import { Plugin } from "@webiny/app/types";
import { BindComponent } from "@webiny/form";
import { IconPrefix, IconName } from "@fortawesome/fontawesome-svg-core";
import { FormData, FormOnSubmit, FormSetValue, FormAPI } from "@webiny/form/types";
import { CoreOptions } from "medium-editor";
import { MenuTreeItem } from "~/admin/views/Menus/types";
import { SecurityPermission } from "@webiny/app-security/types";

export enum PageStatus {
    PUBLISHED = "published",
    UNPUBLISHED = "unpublished",
    REVIEW_REQUESTED = "reviewRequested",
    CHANGES_REQUESTED = "changesRequested",
    DRAFT = "draft"
}

export enum PageImportExportTaskStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}
export type PbElementDataSettingsSpacingValueType = {
    all?: string;
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
};
export type PbElementDataSettingsBackgroundType = {
    color?: string;
    image?: {
        scaling?: string;
        position?: string;
        file?: {
            src?: string;
        };
    };
};
export type PbElementDataSettingsMarginType = {
    advanced?: boolean;
    mobile?: PbElementDataSettingsSpacingValueType;
    desktop?: PbElementDataSettingsSpacingValueType;
};
export type PbElementDataSettingsPaddingType = {
    advanced?: boolean;
    mobile?: PbElementDataSettingsSpacingValueType;
    desktop?: PbElementDataSettingsSpacingValueType;
};
export type PbElementDataSettingsBorderType = {
    width?:
        | number
        | {
              all?: number;
              top?: number;
              right?: number;
              bottom?: number;
              left?: number;
          };
    style?: "none" | "solid" | "dashed" | "dotted";
    radius?:
        | number
        | {
              all?: number;
              topLeft?: number;
              topRight?: number;
              bottomLeft?: number;
              bottomRight?: number;
          };
    borders?: {
        top?: boolean;
        right?: boolean;
        bottom?: boolean;
        left?: boolean;
    };
};
export type PbElementDataTextType = {
    color?: string;
    alignment?: string;
    typography?: string;
    tag?: string;
    data?: {
        text: string;
    };
    desktop?: {
        tag?: string;
    };
};
export interface PbElementDataImageType {
    width?: string | number;
    height?: string | number;
    file?: {
        id?: string;
        src?: string;
    };
    title?: string;
}
export type PbElementDataIconType = {
    id?: [string, string];
    width?: number;
    color?: string;
    svg?: string;
    position?: string;
};
export type PbElementDataSettingsFormType = {
    parent?: string;
    revision?: string;
};
export enum AlignmentTypesEnum {
    HORIZONTAL_LEFT = "horizontalLeft",
    HORIZONTAL_CENTER = "horizontalCenter",
    HORIZONTAL_RIGHT = "horizontalRight",
    VERTICAL_TOP = "verticalTop",
    VERTICAL_CENTER = "verticalCenter",
    VERTICAL_BOTTOM = "verticalBottom"
}
export interface PbElementDataSettingsType {
    alignment?: AlignmentTypesEnum;
    horizontalAlign?: "left" | "center" | "right" | "justify";
    horizontalAlignFlex?: "flex-start" | "center" | "flex-end";
    verticalAlign?: "start" | "center" | "end";
    margin?: PbElementDataSettingsMarginType;
    padding?: PbElementDataSettingsPaddingType;
    height?: {
        [key in DisplayMode]?: {
            value: number;
        };
    };
    background?: PbElementDataSettingsBackgroundType;
    border?: PbElementDataSettingsBorderType;
    grid?: {
        cellsType?: string;
        size?: number;
    };
    columnWidth?: {
        value?: string;
    };
    width?: {
        value?: string;
    };
    className?: string;
    cellsType?: string;
    form?: PbElementDataSettingsFormType;
    [key: string]: any;
}

export interface PbElementDataTypeSource {
    url?: string;
    size?: string;
}
export type PbElementDataType = {
    action?: {
        href: string;
        newTab: boolean;
        clickHandler: string;
        actionType: string;
        variables: PbButtonElementClickHandlerVariable[];
    };
    settings?: PbElementDataSettingsType;
    // this needs to be any since editor can be changed
    text?: PbElementDataTextType;
    image?: PbElementDataImageType;
    buttonText?: string;
    link?: {
        href?: string;
        newTab?: boolean;
    };
    iframe?: {
        url?: string;
    };
    type?: string;
    icon?: PbElementDataIconType;
    source?: PbElementDataTypeSource;
    oembed?: {
        source?: {
            url?: string;
        };
        html?: string;
    };
    width?: number;
    [key: string]: any;
};

export interface PbEditorElement {
    id: string;
    type: string;
    data: PbElementDataType;
    parent?: string;
    elements: (string | PbEditorElement)[];
    content?: PbEditorElement;
    path?: string[];
    source?: string;
    [key: string]: any;
}

export interface PbElement {
    id: string;
    type: string;
    data: PbElementDataType;
    elements: PbElement[];
    content?: PbElement;
    text?: string;
}

/**
 * Determine types for elements
 */
export interface PbTheme {
    colors: {
        background?: string;
        [key: string]: string | undefined;
    };
    // TODO @ts-refactor
    elements: {
        button?: {
            types: {
                className: string;
                label: string;
                name?: string;
            }[];
        };
        [key: string]: any;
    };
    typography?: {
        paragraph?: string;
        description?: string;
    };
    [key: string]: any;
}

export type PbPluginsLoader = Plugin & {
    loadEditorPlugins?: () => Promise<any>;
    loadRenderPlugins?: () => Promise<any>;
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

export interface PbErrorResponse {
    message: string;
    data: Record<string, any>;
    code: string;
}

export interface PbPageDataSettingsGeneral {
    layout?: string;
}
export interface PbPageDataSettingsSeo {
    title: string;
    description: string;
    meta: {
        name: string;
        content: string;
    }[];
}
export interface PbPageDataSettingsSocial {
    title: string;
    description: string;
    meta: {
        property: string;
        content: string;
    }[];
    image?: { src: string } | null;
}
export interface PbPageDataSettings {
    general?: PbPageDataSettingsGeneral;
    seo?: PbPageDataSettingsSeo;
    social?: PbPageDataSettingsSocial;
}
export interface PbPageData {
    id: string;
    pid: string;
    path: string;
    title: string;
    editor: string;
    createdFrom?: string;
    content: any;
    locked: boolean;
    version?: number;
    category: PbCategory;
    status: string | "draft" | "published" | "unpublished";
    settings?: PbPageDataSettings;
    createdOn: string;
    savedOn: string;
    publishedOn: string;
    createdBy: PbIdentity;
    revisions: PbPageRevision[];
}

export interface PbPageRevision {
    id: string;
    pid: string;
    version: number;
    title: string;
    status: string;
    locked: boolean;
    savedOn: string;
}

export interface PbRenderElementPluginRenderParams {
    theme: PbTheme;
    element: PbElement;
}
export type PbRenderElementPlugin = Plugin & {
    type: "pb-render-page-element";
    // Name of the pb-element plugin this render plugin is handling.
    elementType: string;
    render: (params: PbRenderElementPluginRenderParams) => React.ReactNode;
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

export interface PbButtonElementClickHandlerVariable {
    name: string;
    label: string;
    defaultValue: any;
}

export interface PbButtonElementClickHandlerPlugin<TVariables = Record<string, any>>
    extends Plugin {
    type: "pb-page-element-button-click-handler";
    title: string;
    variables?: PbButtonElementClickHandlerVariable[];
    handler: (params: { variables: TVariables }) => void | Promise<void>;
}

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

export type PbAddonRenderPlugin = Plugin & {
    type: "addon-render";
    component: ReactElement;
};

export interface PbDocumentElementPluginRenderProps {
    [key: string]: any;
}
// TODO @ts-refactor verify and delete if not used
export type PbDocumentElementPlugin = Plugin & {
    elementType: "document";
    create(options?: any): PbElement;
    render(props: PbDocumentElementPluginRenderProps): ReactElement;
};

export type PbPageDetailsRevisionContentPlugin = Plugin & {
    type: "pb-page-details-revision-content";
    render(params: { page: PbPageData; getPageQuery: any }): ReactElement;
};

export type PbPageDetailsHeaderRightOptionsMenuItemPlugin = Plugin & {
    type: "pb-page-details-header-right-options-menu-item";
    render(props: any): ReactElement;
};

export type PbPageDetailsRevisionContentPreviewPlugin = Plugin & {
    type: "pb-page-details-revision-content-preview";
    render(params: { page: PbPageData; getPageQuery: any }): ReactElement;
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
            data: MenuTreeItem;
            onSubmit: FormOnSubmit;
            onCancel: () => void;
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
        // Empty element group view rendered in the toolbar.
        emptyView?: ReactElement;
    };
};

export type PbEditorPageElementTitle = (params: { refresh: () => void }) => ReactNode;

export interface PbEditorPageElementPluginToolbar {
    // Element title in the toolbar.
    title?: string | PbEditorPageElementTitle;
    // Element group this element belongs to.
    group?: string;
    // A function to render an element preview in the toolbar.
    preview?: (params?: { theme: PbTheme }) => ReactNode;
}
export type PbEditorPageElementPluginSettings = string[] | Record<string, any>;
export type PbEditorPageElementPlugin = Plugin & {
    type: "pb-editor-page-element";
    elementType: string;
    toolbar?: PbEditorPageElementPluginToolbar;
    // Help link
    help?: string;
    // Whitelist elements that can accept this element (for drag&drop interaction)
    target?: string[];
    // Array of element settings plugin names.
    settings?: PbEditorPageElementPluginSettings;
    // A function to create an element data structure.
    create: (options: Partial<PbElement>, parent?: PbEditorElement) => Omit<PbEditorElement, "id">;
    // A function to render an element in the editor.
    render: (params: { theme?: PbTheme; element: PbEditorElement; isActive: boolean }) => ReactNode;
    // A function to check if an element can be deleted.
    canDelete?: (params: { element: PbEditorElement }) => boolean;
    // Executed when another element is dropped on the drop zones of current element.
    onReceived?: (params: {
        state: EventActionHandlerCallableState;
        meta: EventActionHandlerMeta;
        source: PbEditorElement | DragObjectWithTypeWithTarget;
        target: PbEditorElement;
        position: number;
    }) => EventActionHandlerActionCallableResponse;
    // Executed when an immediate child element is deleted
    onChildDeleted?: (params: {
        element: PbEditorElement;
        child: PbEditorElement;
    }) => PbEditorElement | undefined;
    // Executed after element was created
    onCreate?: OnCreateActions;
    // Render element preview (used when creating element screenshots; not all elements have a simple DOM representation
    // so this callback is used to customize the look of the element in a PNG image)
    renderElementPreview?: (params: {
        element: PbEditorElement;
        width: number;
        height: number;
    }) => ReactElement;
};

export enum OnCreateActions {
    OPEN_SETTINGS = "open-settings",
    SKIP = "skip",
    SKIP_ELEMENT_HEIGHT = "skipElementHighlight"
}

export type PbEditorPageElementActionPlugin = Plugin & {
    type: "pb-editor-page-element-action";
    render: (params: { element: PbEditorElement; plugin: PbEditorPageElementPlugin }) => ReactNode;
};

export type PbPageDetailsPlugin = Plugin & {
    render: (params: { page: PbPageData; [key: string]: any }) => ReactNode;
};

export type PbEditorPageSettingsPlugin = Plugin & {
    type: "pb-editor-page-settings";
    /* Settings group title */
    title: string;
    /* Settings group description */
    description: string;
    /* Settings group icon */
    icon: ReactNode;
    /* Render function that handles the specified `fields` */
    render: (params: {
        data: Record<string, any>;
        setValue: FormSetValue;
        form: FormAPI;
        Bind: BindComponent;
    }) => ReactNode;
};

export interface PbEditorPageQueryFieldsPlugin extends Plugin {
    type: "pb-editor-page-query-fields";
    fields: string;
}

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

export type PbEditorBarPluginShouldRenderProps = {
    plugins: PluginsAtomType;
    activeElement: any;
};

export type PbEditorBarPlugin = Plugin & {
    type: "pb-editor-bar";
    shouldRender(props: PbEditorBarPluginShouldRenderProps): boolean;
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

export type PbEditorDefaultBarCenterPlugin = Plugin & {
    type: "pb-editor-default-bar-center";
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
    toolbar?: {
        drawerClassName?: string;
    };
};

export type PbEditorToolbarBottomPlugin = Plugin & {
    type: "pb-editor-toolbar-bottom";
    renderAction(): ReactElement;
    renderDialog?: () => ReactElement;
};

export type PbEditorBlockPlugin = Plugin & {
    id?: string;
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
    create(): PbEditorElement;
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
    elements?: boolean | string[];
};

export type PbEditorPageElementStyleSettingsPlugin = Plugin & {
    type: "pb-editor-page-element-style-settings";
    render(params: { options?: any }): ReactElement;
    elements?: boolean | string[];
};

export type PbEditorPageElementAdvancedSettingsPlugin = Plugin & {
    type: "pb-editor-page-element-advanced-settings";
    elementType: string;
    render(params: { Bind: BindComponent; data: any; submit: () => void }): ReactElement;
    onSave?: (data: FormData) => FormData;
};

export type PbEditorEventActionPlugin = Plugin & {
    type: "pb-editor-event-action-plugin";
    name: string;
    // returns an unregister event action callable
    // please have one action per plugin
    // you can register more but then unregistering won't work properly
    onEditorMount: (handler: EventActionHandler) => () => void;
    // runs when editor is unmounting
    // by default it runs unregister callable
    // but dev can do what ever and then run unregister callable - or not
    onEditorUnmount?: (handler: EventActionHandler, cb: () => void) => void;
};

export type PbEditorGridPresetPluginType = Plugin & {
    name: string;
    type: "pb-editor-grid-preset";
    cellsType: string;
    icon: React.FC;
};
// this will run when saving the element for later use
export type PbEditorPageElementSaveActionPlugin = Plugin & {
    type: "pb-editor-page-element-save-action";
    elementType: string;
    onSave: (element: PbEditorElement) => PbEditorElement;
};

export type PbEditorPageElementSettingsRenderComponentProps = {
    defaultAccordionValue?: boolean;
};

export type PbConfigPluginType = Plugin & {
    type: "pb-config";
    config(): PbConfigType;
};

export type PbConfigType = {
    maxEventActionsNesting: number;
};

export enum DisplayMode {
    DESKTOP = "desktop",
    TABLET = "tablet",
    MOBILE_LANDSCAPE = "mobile-landscape",
    MOBILE_PORTRAIT = "mobile-portrait"
}

export type PbEditorResponsiveModePlugin = Plugin & {
    type: "pb-editor-responsive-mode";
    config: {
        displayMode: string;
        toolTip: {
            title: string;
            subTitle: string;
            body: string;
            subTitleIcon?: ReactNode;
        };
        icon: React.ReactElement;
    };
};

export type PbRenderResponsiveModePlugin = Plugin & {
    type: "pb-render-responsive-mode";
    config: {
        displayMode: string;
        maxWidth: number;
        minWidth: number;
    };
};

export type PbEditorElementPluginArgs = {
    create?: (defaultValue: Partial<PbEditorElement>) => PbEditorElement;
    settings?: (
        defaultValue: PbEditorPageElementPluginSettings
    ) => Array<string | Array<string | any>>;
    toolbar?: (defaultValue: PbEditorPageElementPluginToolbar) => React.ReactNode;
    elementType?: string;
};

export type MediumEditorOptions = (defaultOptions: CoreOptions) => CoreOptions;

export interface PbEditorTextElementPluginsArgs extends PbEditorElementPluginArgs {
    mediumEditorOptions?: MediumEditorOptions;
}

export interface PbEditorTextElementProps {
    elementId: string;
    mediumEditorOptions?: MediumEditorOptions;
}

export type PbRenderElementPluginArgs = {
    elementType?: string;
};

// ============== EVENT ACTION HANDLER ================= //
export interface EventActionHandlerCallableState extends PbState {
    getElementById(id: string): Promise<PbEditorElement>;
    getElementTree(element?: PbEditorElement): Promise<any>;
}

export interface EventActionHandler {
    on(
        target: EventActionHandlerTarget,
        callable: EventActionCallable
    ): EventActionHandlerUnregister;
    trigger<T extends EventActionHandlerCallableArgs>(
        ev: EventAction<T>
    ): Promise<Partial<PbState>>;
    undo: () => void;
    redo: () => void;
    startBatch: () => void;
    endBatch: () => void;
    enableHistory: () => void;
    disableHistory: () => void;
    getElementTree: (element?: PbEditorElement) => Promise<PbEditorElement>;
}

export interface EventActionHandlerTarget {
    new (...args: any[]): EventAction<any>;
}
export interface EventActionHandlerUnregister {
    (): boolean;
}

export interface EventActionHandlerMeta {
    client: any;
    eventActionHandler: EventActionHandler;
}

export interface EventActionHandlerConfig {
    maxEventActionsNesting: number;
}

export interface EventActionHandlerActionCallableResponse {
    state?: Partial<EventActionHandlerCallableState>;
    actions: BaseEventAction[];
}

export interface EventActionHandlerMutationActionCallable<T, A = void> {
    (state: T, args: A): T;
}

export interface EventActionHandlerCallableArgs {
    [key: string]: any;
}

export interface EventActionCallable<T extends EventActionHandlerCallableArgs = any> {
    (state: EventActionHandlerCallableState, meta: EventActionHandlerMeta, args?: T):
        | EventActionHandlerActionCallableResponse
        | Promise<EventActionHandlerActionCallableResponse>;
}

/**
 * Data types
 */
export interface PbIdentity {
    id: string;
    type: string;
    displayName: string;
}
export interface PbCategory {
    name: string;
    slug: string;
    url: string;
    layout: string;
    createdOn: string;
    createdBy: PbIdentity;
}
export interface PbMenu {
    id: string;
    name: string;
    title: string;
    url: string;
    slug: string;
    description: string;
}
/**
 * TODO: have types for both API and app in the same package?
 * GraphQL response types
 */
export interface PageBuilderListCategoriesResponse {
    pageBuilder: {
        listCategories: {
            data?: PbCategory[];
            error?: PbErrorResponse;
        };
    };
}
export interface PageBuilderImportExportSubTask {
    id: string;
    createdOn: Date;
    createdBy: {
        id: string;
        displayName: string;
        type: string;
    };
    status: "pending" | "processing" | "completed" | "failed";
    data: {
        page: PbPageData;
        [key: string]: any;
    };
    stats: {
        pending: number;
        processing: number;
        completed: number;
        failed: number;
        total: number;
    };
    error: Record<string, string>;
}

export interface PageBuilderGetPageDataResponse {
    data?: PbPageData;
    error?: PbErrorResponse;
}
export interface PageBuilderGetPageResponse {
    pageBuilder: {
        getPage: PageBuilderGetPageDataResponse;
    };
}

export interface PageBuilderListDataResponse {
    data?: PbPageData[];
    error?: PbErrorResponse;
}
export interface PageBuilderListResponse {
    pageBuilder: {
        listPages: PageBuilderListDataResponse;
    };
}
/**
 * Form data
 */
export interface PageBuilderFormDataFileItem {
    id: string;
    src: string;
}

export interface PageBuilderFormDataSettingsSocialMeta {
    property: string;
    content: string | number;
}
export interface PageBuilderFormDataSettings {
    settings: {
        general: {
            snippet: string;
            image: PageBuilderFormDataFileItem;
            tags: string[];
            layout: string;
        };
        social: {
            title: string;
            description: string;
            image: PageBuilderFormDataFileItem;
            meta: PageBuilderFormDataSettingsSocialMeta[];
        };
        seo: {
            title: string;
            description: string;
            meta: {
                name: string;
                content: string;
            };
        };
    };
}

export interface PageBuilderSecurityPermission extends SecurityPermission {
    own?: boolean;
    rwd?: string;
    pw?: string | boolean;
}
