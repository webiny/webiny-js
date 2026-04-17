import { createAbstraction } from "@webiny/feature/admin";
import type { z } from "zod";

// ---------------------------------------------------------------------------
// Field types
// ---------------------------------------------------------------------------

export interface IFieldConfig {
    name: string;
    type: string;
    label?: string;
    placeholder?: string;
    defaultValue?: unknown;
    renderer?: string;
    hidden: boolean;
    required: boolean;
    requiredMessage?: string;
    disabled: boolean;
    schema?: z.ZodTypeAny;
    options?: IValueOption[] | ((form: IFormModel) => IValueOption[]);
    beforeChangeCallbacks?: BeforeChangeCallback[];
    afterChangeCallbacks?: AfterChangeCallback[];
    afterSetValueCallbacks?: AfterSetValueCallback[];
    onBlurCallbacks?: OnBlurCallback[];
}

export interface IValueOption {
    label: string;
    value: string;
    disabled?: boolean;
}

export interface IFieldValidation {
    isValid: boolean | null;
    message?: string;
}

export interface IFieldVM {
    name: string;
    type: string;
    label?: string;
    placeholder?: string;
    value: unknown;
    validation: IFieldValidation;
    required: boolean;
    disabled: boolean;
    renderer?: string;
    options?: IValueOption[];
    onChange: (value: unknown) => void;
    onBlur: () => void;
}

export interface IObjectFieldVM extends IFieldVM {
    type: "object";
    isList: boolean;
    /** Child field VMs for non-list object fields. */
    fields: IFieldVM[];
    /** Items for list-mode object fields. */
    items: IObjectFieldItemVM[];
    addItem: () => void;
    removeItem: (index: number) => void;
}

export interface IObjectFieldItemVM {
    key: string;
    fields: IFieldVM[];
    remove: () => void;
}

export interface IField {
    readonly name: string;
    readonly type: string;
    readonly visible: boolean;
    readonly vm: IFieldVM;
    readonly config: IFieldConfig;
    getValue<T = unknown>(): T;
    setValue(value: unknown): void;
    setValueSilent(value: unknown): void;
    setDisabled(value: boolean): void;
    setVisible(value: boolean): void;
    setForm(form: IFormModel): void;
    setValidation(validation: IFieldValidation): void;
    resetValidation(): void;
    validate(): Promise<boolean>;
    remove(): void;
    addBeforeChange(cb: BeforeChangeCallback): void;
    addAfterChange(cb: AfterChangeCallback): void;
    addAfterSetValue(cb: AfterSetValueCallback): void;
    addOnBlur(cb: OnBlurCallback): void;
    blur(): void;
    as<T extends keyof FieldTypeMap>(type: T): FieldTypeMap[T];
}

/**
 * Maps field type strings to their typed field interfaces.
 * Extended via module augmentation when new field types are registered.
 */
export interface FieldTypeMap {
    text: IField;
    select: ISelectField;
    object: IObjectField;
}

export interface ISelectField extends IField {
    readonly config: IFieldConfig & {
        options?: IValueOption[] | ((form: IFormModel) => IValueOption[]);
    };
}

// ---------------------------------------------------------------------------
// Object / List field types
// ---------------------------------------------------------------------------

export interface IObjectFieldConfig extends IFieldConfig {
    childBuilders: Record<string, IFieldBuilder>;
    isList: boolean;
    listSchema?: z.ZodTypeAny;
}

export interface IObjectField extends IField {
    readonly isList: boolean;
    readonly children: Map<string, IField>;
    readonly items: IListItemField[];
    addItem(data?: Record<string, unknown>): void;
    removeItem(index: number): void;
    getData(): Record<string, unknown> | Record<string, unknown>[];
}

export interface IListItemField {
    readonly key: string;
    readonly children: Map<string, IField>;
    getData(): Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Callback types
// ---------------------------------------------------------------------------

export type BeforeChangeCallback = (value: unknown, form: IFormModel) => unknown;
export type AfterChangeCallback = (value: unknown, form: IFormModel) => void;
export type AfterSetValueCallback = (value: unknown, form: IFormModel) => void;
export type OnBlurCallback = (value: unknown, form: IFormModel) => void;

// ---------------------------------------------------------------------------
// Layout types
// ---------------------------------------------------------------------------

export type LayoutNode = IRowNode | ISeparatorNode | ITabsNode | IElementNode;

export interface IRowNode {
    type: "row";
    fieldIds: string[];
}

export interface ISeparatorNode {
    type: "separator";
}

export interface ITabDefinition {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    layout: LayoutNode[];
}

export interface ITabsNode {
    type: "tabs";
    id?: string;
    tabs: ITabDefinition[];
}

export interface IElementNode {
    type: "element";
    id?: string;
    renderer: string;
    props?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Layout VM types
// ---------------------------------------------------------------------------

export type LayoutNodeVM = IRowNodeVM | ISeparatorNodeVM | ITabsNodeVM | IElementNodeVM;

export interface IRowNodeVM {
    type: "row";
    fields: IFieldVM[];
}

export interface ISeparatorNodeVM {
    type: "separator";
}

export interface ITabDefinitionVM {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    hasErrors: boolean;
    layout: LayoutNodeVM[];
}

export interface ITabsNodeVM {
    type: "tabs";
    id?: string;
    tabs: ITabDefinitionVM[];
    activeTabId: string;
    setActiveTab: (id: string) => void;
}

export interface IElementNodeVM {
    type: "element";
    renderer: string;
    props?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Layout modifier types
// ---------------------------------------------------------------------------

export type LayoutPosition =
    | { type: "before"; target: string }
    | { type: "after"; target: string }
    | { type: "replace"; target: string };

export interface IPositionedLayoutNode {
    node: LayoutNode;
    position?: LayoutPosition;
}

/**
 * Chainable handle returned by modifier layout.row().
 * Can be used as-is (appended) or positioned via .before()/.after()/.replace().
 */
export interface ILayoutNodeHandle extends IPositionedLayoutNode {
    before(target: string): IPositionedLayoutNode;
    after(target: string): IPositionedLayoutNode;
    replace(target: string): IPositionedLayoutNode;
}

// ---------------------------------------------------------------------------
// Named layout node access types
// ---------------------------------------------------------------------------

export interface ITabsHandle {
    tab(definition: ITabDefinition): ITabHandle;
    tab(id: string): ITabHandle;
}

export interface ITabHandle {
    layout(factory: (layout: ILayoutBuilder) => LayoutNode[]): void;
    before(target: string): void;
    after(target: string): void;
}

export interface ILayoutNodeAccessHandle {
    as(type: "tabs"): ITabsHandle;
}

// ---------------------------------------------------------------------------
// Modifier types
// ---------------------------------------------------------------------------

export interface IFormModifier {
    modify(form: IFormModel): void;
}

export interface ILayoutModifier {
    row(...fieldIds: string[]): ILayoutNodeHandle;
    separator(): ILayoutNodeHandle;
    tabs(config: { id?: string; tabs: ITabDefinition[] }): ILayoutNodeHandle;
    element(renderer: string, props?: Record<string, unknown>): ILayoutNodeHandle;
    remove(target: string): void;
}

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

export interface IFormError {
    path: string;
    label?: string;
    message: string;
}

export interface IFormVM {
    layout: LayoutNodeVM[];
    errors: IFormError[];
    isDirty: boolean;
    isValid: boolean | null;
}

export interface IFormModel {
    field(name: string): IField;
    fields(
        factory: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder | undefined>
    ): void;
    layout(factory: (layout: ILayoutModifier) => (LayoutNode | IPositionedLayoutNode)[]): void;
    layout(nodeId: string): ILayoutNodeAccessHandle;
    getData(): Record<string, unknown>;
    setData(data: Record<string, unknown>): void;
    reset(): void;
    validate(): Promise<boolean>;
    submit<T = Record<string, unknown>>(): Promise<T | false>;
    readonly isDirty: boolean;
    readonly isValid: boolean | null;
    readonly errors: IFormError[];
    readonly vm: IFormVM;
}

// ---------------------------------------------------------------------------
// FormModel namespace — groups all public types under one import
// ---------------------------------------------------------------------------

export namespace FormModel {
    export type FieldConfig = IFieldConfig;
    export type ValueOption = IValueOption;
    export type FieldValidation = IFieldValidation;
    export type FieldVM = IFieldVM;
    export type Field = IField;
    export type SelectField = ISelectField;
    export type ObjectField = IObjectField;
    export type ObjectFieldConfig = IObjectFieldConfig;
    export type BeforeChange = BeforeChangeCallback;
    export type AfterChange = AfterChangeCallback;
    export type AfterSetValue = AfterSetValueCallback;
    export type OnBlur = OnBlurCallback;
    export type RowNode = IRowNode;
    export type RowNodeVM = IRowNodeVM;
    export type SeparatorNode = ISeparatorNode;
    export type SeparatorNodeVM = ISeparatorNodeVM;
    export type TabsNode = ITabsNode;
    export type TabDefinition = ITabDefinition;
    export type TabsNodeVM = ITabsNodeVM;
    export type TabDefinitionVM = ITabDefinitionVM;
    export type ElementNode = IElementNode;
    export type ElementNodeVM = IElementNodeVM;
    export type ObjectFieldVM = IObjectFieldVM;
    export type ObjectFieldItemVM = IObjectFieldItemVM;
    export type FormError = IFormError;
    export type FormVM = IFormVM;
    export type Interface = IFormModel;
    export type Modifier = IFormModifier;
    export type LayoutModifier = ILayoutModifier;
}

// ---------------------------------------------------------------------------
// FormModelFactory abstraction
// ---------------------------------------------------------------------------

export interface IFormModelFactory {
    create(config: IFormModelConfig): IFormModel;
}

export interface IFormModelConfig {
    fields: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder>;
    layout?: (layout: ILayoutBuilder) => LayoutNode[];
    validateOnSubmit?: boolean;
}

export interface ILayoutBuilder {
    row(...fieldIds: string[]): IRowNode;
    separator(): ISeparatorNode;
    tabs(config: { id?: string; tabs: ITabDefinition[] }): ITabsNode;
    element(renderer: string, props?: Record<string, unknown>): IElementNode;
}

export interface IFieldBuilder {
    label(text: string): this;
    placeholder(text: string): this;
    schema(zodSchema: z.ZodTypeAny): this;
    defaultValue(value: unknown): this;
    renderer(name: string): this;
    hidden(): this;
    required(message?: string): this;
    disabled(value?: boolean): this;
    beforeChange(fn: BeforeChangeCallback): this;
    afterChange(fn: AfterChangeCallback): this;
    afterSetValue(fn: AfterSetValueCallback): this;
    onBlur(fn: OnBlurCallback): this;
    build(name: string): IFieldConfig;
}

export interface ISelectFieldBuilder extends IFieldBuilder {
    options(opts: IValueOption[] | ((form: IFormModel) => IValueOption[])): this;
}

export interface IObjectFieldBuilder extends IFieldBuilder {
    fields(fn: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder>): this;
    list(): this;
    listSchema(schema: z.ZodTypeAny): this;
}

export interface IFieldBuilderRegistry {
    text(): IFieldBuilder;
    select(): ISelectFieldBuilder;
    object(): IObjectFieldBuilder;
}

export const FormModelFactory = createAbstraction<IFormModelFactory>("FormModelFactory");

export namespace FormModelFactory {
    export type Interface = IFormModelFactory;
    export type Config = IFormModelConfig;
    export type LayoutBuilder = ILayoutBuilder;
    export type FieldBuilder = IFieldBuilder;
    export type SelectFieldBuilder = ISelectFieldBuilder;
    export type ObjectFieldBuilder = IObjectFieldBuilder;
    export type FieldBuilderRegistry = IFieldBuilderRegistry;
}
