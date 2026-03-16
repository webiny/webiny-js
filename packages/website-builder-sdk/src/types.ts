import type * as CSS from "csstype";
import type { BindingsApi } from "~/BindingsApi.js";
import type { ShorthandCssProperties } from "./types/ShorthandCssProperties.js";
import type { InputFactory } from "~/createInput.js";
import type { Breakpoint } from "~/types/WebsiteBuilderTheme.js";
export type { WebsiteBuilderTheme, Breakpoint } from "./types/WebsiteBuilderTheme.js";

type CSSProperties = CSS.Properties<string | number>;

export type ElementMap = Record<string, DocumentElement>;

export type DocumentState = Record<string, any>;

export type DocumentMetadata = Record<string, any>;

export type InputValueBinding<T = any> = ValueBinding<T> & {
    id: string;
    type: string;
    translatable?: boolean;
    list?: boolean;
};

export type StyleValueBinding<T = any> = ValueBinding<T>;

export type ValueBinding<T = any> = {
    static?: T;
    expression?: string;
};

export type RepeatValueBinding = {
    expression: string;
};

export type CssProperties = Omit<CSSProperties, ShorthandCssProperties>;

export type DocumentElementStyleBindings = Partial<{
    [K in keyof CssProperties]: StyleValueBinding<CssProperties[K]>;
}>;

export type DocumentElementInputBindings = {
    [inputName: string]: InputValueBinding;
};

export type DocumentElementBindings = {
    $repeat?: RepeatValueBinding;
    inputs?: DocumentElementInputBindings;
    styles?: DocumentElementStyleBindings;
    metadata?: Record<string, any>;
    overrides?: {
        [key: string]: {
            inputs?: DocumentElementInputBindings;
            styles?: DocumentElementStyleBindings;
        };
    };
};

export type DocumentBindings = {
    [elementId: string]: DocumentElementBindings;
};

export type ResolvedComponent<TComponent = any> = {
    component: TComponent;
    inputs: Record<string, any>;
    manifest: ComponentManifest;
    styles: SerializableCSSStyleDeclaration;
};

export type ResolvedElement = {
    id: string;
    inputs: Record<string, any>;
    styles: SerializableCSSStyleDeclaration;
};

export type Component = {
    component: any;
    manifest: ComponentManifest;
};

export type ComponentBlueprint<TComponent = any, TManifest = any> = {
    component: TComponent;
    manifest: TManifest;
};

export type ComponentGroupItem = {
    // Name of the component.
    name: string;
    // Optionally, define an exact element to insert.
    item?: DocumentElementTemplate;
};

export type SerializedComponentGroup = ComponentGroup & {
    filter?: string;
};

export type ComponentGroupFilterContext = {
    document: EditorDocument;
};

export type ComponentGroup = {
    name: string;
    label: string;
    description?: string;
    filter?: (component: ComponentManifest, context: ComponentGroupFilterContext) => boolean;
};

export type ResponsiveStyles = {
    [key: string]: SerializableCSSStyleDeclaration;
};

export type ConstraintElementContext = {
    /** Component name (e.g., "FunnelBuilder/Step") */
    name: string;
    /** Component tags */
    tags: string[];

    /** Get the parent element context. undefined for root. */
    getParent(): ConstraintElementContext | undefined;

    /** Index of this element among siblings in the same parent slot. -1 if not in a list slot. */
    childIndex(): number;
    /** Total siblings in the same parent slot. -1 if not in a list slot. */
    childCount(): number;
    /** True if this element is the last among siblings in its parent slot. */
    isLastChild(): boolean;
    /** True if this element is the first among siblings in its parent slot. */
    isFirstChild(): boolean;
};

export type ConstraintContext = {
    /** The component/element this constraint is about */
    component: ConstraintElementContext;
    /** The direct parent element at the drop target */
    parent: ConstraintElementContext;
    /** The target slot name (e.g., "children", "leftColumn", "rightColumn") */
    slot: string;
    /** True if the direct parent is the given component */
    isChildOf: (componentName: string) => boolean;
    /** True if any ancestor (including parent) is the given component */
    isDescendantOf: (componentName: string) => boolean;
    /** Find the nearest ancestor matching a component name */
    getAncestor: (componentName: string) => ConstraintElementContext | undefined;
    /** True if the component being placed has the given tag */
    hasTag: (tag: string) => boolean;
    /** Number of items currently in the target slot */
    slotChildCount: () => number;
    /** Count instances of a component type in the entire document */
    countInstances: (componentName: string) => number;
    /** Debug logger — safe to call inside serialized constraints */
    log: (...args: any[]) => void;
};

export type ComponentConstraint = {
    /** Return true to ALLOW placement, false to BLOCK */
    check: (ctx: ConstraintContext) => boolean;
    /** Message shown when constraint is violated */
    message?: string;
};

// Flow-control symbols for handler arrays
declare const STOP: unique symbol;
declare const CONTINUE: unique symbol;
export type Stop = typeof STOP;
export type Continue = typeof CONTINUE;
export type HandlerResult = void | Stop | Continue;

export type OnChangeAction = "create" | "update" | "delete";

export type OnChangeElementContext = {
    id: string;
    component: ComponentManifest;
    inputs: Record<string, any>;
};

export type ManifestAncestorContext = {
    id: string;
    component: ComponentManifest;
    inputs: Record<string, any>;
    updateInputs: (cb: (inputs: Record<string, any>) => void) => void;
    getElement: (id: string) => OnChangeElementContext | undefined;
};

export type ComponentChangeContext<TInputs = Record<string, any>> = {
    action: OnChangeAction;
    id: string;
    component: ComponentManifest;
    inputs: TInputs;
    styles: Record<string, any>;
    getAncestor: (componentName: string) => ManifestAncestorContext | undefined;
    getElement: (id: string) => OnChangeElementContext | undefined;
    createElement: (params: any) => any;
    breakpoint: string;
    log: (...args: any[]) => void;
    stop: () => Stop;
    continue: () => Continue;
};

export type DescendantChangeContext<TInputs = Record<string, any>> = {
    action: OnChangeAction;
    descendant: {
        component: ComponentManifest;
        id: string;
        inputs: Record<string, any>;
    };
    inputs: TInputs;
    updateInputs: (cb: (inputs: TInputs) => void) => void;
    getElement: (id: string) => OnChangeElementContext | undefined;
    breakpoint: string;
    log: (...args: any[]) => void;
    stop: () => Stop;
    continue: () => Continue;
};

export type ComponentChangeHandler<TInputs = Record<string, any>> = (
    ctx: ComponentChangeContext<TInputs>
) => HandlerResult;

export type DescendantChangeHandler<TInputs = Record<string, any>> = (
    ctx: DescendantChangeContext<TInputs>
) => HandlerResult;

export type ComponentManifest = {
    name: string;
    group?: string;
    label?: string;
    image?: string;
    inputs: ComponentInput[];
    canDrag?: boolean;
    canDelete?: boolean | ComponentConstraint;
    acceptsChildren?: boolean;
    hideFromToolbar?: boolean;
    hideStyleSettings?: string[];
    autoApplyStyles?: boolean;
    tags: string[];
    constraints?: ComponentConstraint[];
    descendantConstraints?: ComponentConstraint[];
    onChange?: ComponentChangeHandler | ComponentChangeHandler[];
    onDescendantChange?: DescendantChangeHandler | DescendantChangeHandler[];
    defaults?: {
        inputs?: Record<string, any>;
        styles?: SerializableCSSStyleDeclaration;
        overrides?: {
            [breakpoint: string]: {
                inputs?: Record<string, any>;
                styles?: SerializableCSSStyleDeclaration;
            };
        };
    };
};

export type DocumentElementTemplate = Omit<DocumentElement, "id">;

export type ElementComponent = {
    name: string;
};

export type DocumentElement = {
    type: "Webiny/Element";
    id: string;
    component: ElementComponent;
    parent?: {
        id: string;
        slot: string;
    };
    styles?: ResponsiveStyles;
};

export type SerializableCSSStyleDeclaration = {
    [K in keyof CssProperties]?: CssProperties[K];
};

export type Document = {
    id: string;
    state: DocumentState;
    version: number;
    properties: Record<string, any>;
    metadata: DocumentMetadata;
    bindings: DocumentBindings;
    elements: ElementMap;
};

export type PublicPage = Pick<
    Page,
    "id" | "version" | "properties" | "bindings" | "elements" | "extensions" | "metadata" | "state"
>;

export type PublicRedirect = {
    id: string;
    from: string;
    to: string;
    permanent: boolean;
};

export type EditorPage = EditorDocument & Pick<Page, "properties" | "status" | "location">;

export type EditorDocument = Document;

export type Page = Document & {
    id: string;
    status: string;
    version: number;
    location: {
        folderId: string;
    };
    properties: {
        title: string;
        snippet: string;
        /*image: {
            id: string;
            name: string;
            size: number;
            mimeType: string;
            src: string;
        };*/
        path: string;
        tags: string[];
        seo: {
            title: string;
            description: string;
            metaTags: Array<{ name: string; content: string }>;
        };
        social: {
            title: string;
            description: string;
            /*image: {
                id: string;
                name: string;
                size: number;
                mimeType: string;
                src: string;
            };*/
            metaTags: Array<{ property: string; content: string }>;
        };
    };
    extensions: Record<string, any>;
    metadata: DocumentMetadata;
};

export type Box = {
    depth: number;
    parentId: string;
    parentSlot: string;
    parentIndex: number;
    width: number;
    height: number;
    top: number;
    left: number;
};

export type ElementBoxData = Box & {
    type: "element";
};

export type ElementSlotBoxData = Box & {
    type: "element-slot";
};

export type BoxData = ElementBoxData | ElementSlotBoxData;

export type EditorViewportInfo = PreviewViewportInfo & {
    top: number;
    left: number;
    // Current breakpoint name
    breakpoint: string;
    breakpoints: Breakpoint[];
};

export type PreviewViewportInfo = {
    // Viewport width (only the visible part)
    width: number;
    // Viewport height (only the visible part)
    height: number;
    // Full iframe width
    scrollWidth: number;
    // Full iframe height
    scrollHeight: number;
    // Iframe horizontal scroll offset
    scrollX: number;
    // Iframe vertical scroll offest
    scrollY: number;
};

export type BoxesData = Record<string, BoxData>;

export type EditorViewportData = {
    boxes: BoxesData;
    viewport: EditorViewportInfo;
};

export type PreviewViewportData = {
    boxes: BoxesData;
    viewport: PreviewViewportInfo;
};

export type ApiOptions = Record<string, any>;

export type GetPageOptions = ApiOptions;

export interface ListPagesOptions {
    where?: Record<string, any>;
    limit?: number;
    after?: string;
    sort?: string[];
    search?: string;
}

export interface ListPagesMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string | null;
}

export interface ListPagesResult {
    data: Array<Omit<PublicPage, "elements" | "bindings">>;
    meta: ListPagesMeta;
}

export interface IDataProvider {
    getPageByPath(path: string, options?: GetPageOptions): Promise<PublicPage | null>;
    getPageById(id: string, options?: GetPageOptions): Promise<PublicPage | null>;
    listPages(options?: ListPagesOptions): Promise<ListPagesResult>;
}

export interface IEnvironment {
    isClient(): boolean;
    isServer(): boolean;
    isPreview(): boolean;
}

export interface IContentSdk {
    getPage(path: string): Promise<PublicPage | null>;
    listPages(options?: ListPagesOptions): Promise<ListPagesResult>;
}

// Input types

// inputTypes.ts
export type BaseInput<T = any> = {
    name: string;
    type: string;
    onChange?: (
        bindings: ReturnType<BindingsApi["getPublicApi"]>,
        context: { breakpoint: string }
    ) => void;
    label?: string;
    description?: string;
    helperText?: string;
    defaultValue?: T;
    responsive?: boolean;
    required?: boolean;
    hideFromUi?: boolean;
    renderer?: string;
    list?: boolean;
    translatable?: boolean;
};

// Discriminated union per input type
export type TextInput = BaseInput<string> & {
    type: "text";
};

export type SlotInput = BaseInput<any> & {
    type: "slot";
    components?: string[];
};

export type TagsInput = BaseInput<string[]> & {
    type: "text";
};

export type LongTextInput = BaseInput<string> & {
    type: "longText";
};

export type NumberInput = BaseInput<number> & {
    type: "number";
    minValue?: number;
};

export type BooleanInput = BaseInput<boolean> & {
    type: "boolean";
};

export type ColorInput = BaseInput<string> & {
    type: "color";
};

export type FileInput = BaseInput<string> & {
    type: "file";
    allowedFileTypes: string[];
};

export type DateTimeInput = BaseInput<string> & {
    type: "datetime";
};

export type LexicalInput = BaseInput<string> & {
    type: "lexical";
};

export type SelectInput = BaseInput<string> & {
    type: "select";
    options: { label: string; value: string }[];
    showResetAction?: boolean;
};

export type RadioInput = BaseInput<string> & {
    type: "radio";
    options: { label: string; value: string }[];
};

export type ObjectInput = BaseInput<Record<string, any>> & {
    type: "object";
    fields: ComponentInput[];
};

export type CustomInput = BaseInput<any> & {
    type: string;
    fields: ComponentInput[];
};

// Union of all input types
export type ComponentInput =
    | TextInput
    | LongTextInput
    | NumberInput
    | BooleanInput
    | ColorInput
    | FileInput
    | DateTimeInput
    | LexicalInput
    | SelectInput
    | RadioInput
    | TagsInput
    | ObjectInput
    | SlotInput
    | CustomInput;

export type ManifestInputsArray<
    TInputs,
    TAllowChildren extends boolean
> = TAllowChildren extends true
    ? {
          [K in Exclude<keyof TInputs, "children">]: InputFactory<K & string>;
      }[Exclude<keyof TInputs, "children">][]
    : {
          [K in keyof TInputs]: InputFactory<K & string>;
      }[keyof TInputs][];

export type ManifestInputsObject<
    TInputs,
    TAllowChildren extends boolean
> = TAllowChildren extends true
    ? { [K in Exclude<keyof TInputs, "children">]: InputFactory<K & string> }
    : { [K in keyof TInputs]: InputFactory<K & string> };

export type ComponentManifestInput<TInputs> =
    | (Omit<
          ComponentManifest,
          "inputs" | "acceptsChildren" | "tags" | "onChange" | "onDescendantChange"
      > & {
          acceptsChildren: true;
          tags?: string[];
          inputs?: ManifestInputsArray<TInputs, true> | ManifestInputsObject<TInputs, true>;
          onChange?: ComponentChangeHandler<TInputs> | ComponentChangeHandler<TInputs>[];
          onDescendantChange?:
              | DescendantChangeHandler<TInputs>
              | DescendantChangeHandler<TInputs>[];
      })
    | (Omit<
          ComponentManifest,
          "inputs" | "acceptsChildren" | "tags" | "onChange" | "onDescendantChange"
      > & {
          acceptsChildren?: false;
          tags?: string[];
          inputs: ManifestInputsArray<TInputs, false> | ManifestInputsObject<TInputs, false>;
          onChange?: ComponentChangeHandler<TInputs> | ComponentChangeHandler<TInputs>[];
          onDescendantChange?:
              | DescendantChangeHandler<TInputs>
              | DescendantChangeHandler<TInputs>[];
      });
