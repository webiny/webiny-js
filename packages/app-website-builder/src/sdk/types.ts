import type { CSSProperties } from "react";
import type { ResolveElementParams } from "~/sdk/ComponentResolver";
import type { BindingsApi } from "~/sdk/BindingsApi";
import { ShorthandCssProperties } from "./types/ShorthandCssProperties";

export type ElementMap = Record<string, DocumentElement>;

export type DocumentState = Record<string, any>;

export type InputValueBinding<T = any> = ValueBinding<T> & {
    id: string;
    type: string;
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

export type Document = {
    properties: Record<string, any>;
    state: DocumentState;
    bindings: DocumentBindings;
    elements: ElementMap;
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

export type ComponentGroup = {
    name: string;
    label: string;
    description?: string;
    filter?: (component: ComponentManifest) => boolean;
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
    autoApplyStyles?: boolean;
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

export type Page = Document;

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

export type ApiOptions = {
    preview?: boolean;
};

export type GetPageOptions = ApiOptions;
export type ListPagesOptions = ApiOptions;

export interface IDataProvider {
    getPage(path: string, options?: GetPageOptions): Promise<Page | null>;
    listPages(options?: ListPagesOptions): Promise<Page[]>;
}

export interface IEnvironment {
    isClient(): boolean;
    isServer(): boolean;
    isPreview(): boolean;
}

export interface IContentSdk extends IDataProvider {
    registerComponent(component: Component): void;
    resolveElement(params: ResolveElementParams): ResolvedComponent[] | null;
}

export type Breakpoint = {
    name: string;
    minWidth: number;
    maxWidth: number;
};

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
