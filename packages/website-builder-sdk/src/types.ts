import type * as CSS from "csstype";
import type { BindingsApi } from "~/BindingsApi.js";
import type { ShorthandCssProperties } from "./types/ShorthandCssProperties.js";
export type { WebsiteBuilderTheme, Breakpoint } from "./types/WebsiteBuilderTheme.js";

type CSSProperties = CSS.Properties<string | number>;

export type ElementMap = Record<string, DocumentElement>;

export type DocumentState = Record<string, any>;

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

export type ComponentManifest = {
    name: string;
    group?: string;
    label?: string;
    image?: string;
    inputs?: ComponentInput[];
    canDrag?: boolean;
    canDelete?: boolean;
    acceptsChildren?: boolean;
    hideFromToolbar?: boolean;
    hideStyleSettings?: string[];
    autoApplyStyles?: boolean;
    tags?: string[];
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
    bindings: DocumentBindings;
    elements: ElementMap;
};

export type PublicPage = Pick<
    Page,
    "id" | "version" | "properties" | "bindings" | "elements" | "state"
>;

export type PublicRedirect = {
    id: string;
    from: string;
    to: string;
    permanent: boolean;
};

export type EditorPage = EditorDocument & Pick<Page, "properties" | "status" | "location">;

export type EditorDocument = Document & {
    metadata: Record<string, any>;
};

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
};

export type PreviewViewportInfo = {
    width: number;
    height: number;
    scrollX: number;
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
export type ListPagesOptions = ApiOptions;

export interface IDataProvider {
    getPageByPath(path: string, options?: GetPageOptions): Promise<PublicPage | null>;
    getPageById(id: string, options?: GetPageOptions): Promise<PublicPage | null>;
    listPages(options?: ListPagesOptions): Promise<PublicPage[]>;
}

export interface IEnvironment {
    isClient(): boolean;
    isServer(): boolean;
    isPreview(): boolean;
}

export interface IContentSdk {
    getPage(path: string): Promise<PublicPage | null>;
    listPages(options?: ListPagesOptions): Promise<PublicPage[]>;
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
