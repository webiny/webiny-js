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
}

export interface IField {
    readonly name: string;
    readonly type: string;
    getValue(): unknown;
    setValue(value: unknown): void;
    setDisabled(value: boolean): void;
    remove(): void;
    addBeforeChange(cb: BeforeChangeCallback): void;
    addAfterChange(cb: AfterChangeCallback): void;
    as<T extends keyof FieldTypeMap>(type: T): FieldTypeMap[T];
    readonly vm: IFieldVM;
    readonly config: IFieldConfig;
}

/**
 * Maps field type strings to their typed field interfaces.
 * Extended via module augmentation when new field types are registered.
 */
export interface FieldTypeMap {
    text: IField;
    select: ISelectField;
}

export interface ISelectField extends IField {
    readonly config: IFieldConfig & {
        options?: IValueOption[] | ((form: IFormModel) => IValueOption[]);
    };
}

// ---------------------------------------------------------------------------
// Callback types
// ---------------------------------------------------------------------------

export type BeforeChangeCallback = (value: unknown, form: IFormModel) => unknown;
export type AfterChangeCallback = (value: unknown, form: IFormModel) => void;

// ---------------------------------------------------------------------------
// Layout types
// ---------------------------------------------------------------------------

export type LayoutNode = IRowNode;

export interface IRowNode {
    type: "row";
    fieldIds: string[];
}

export type LayoutNodeVM = IRowNodeVM;

export interface IRowNodeVM {
    type: "row";
    fields: IFieldVM[];
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
// Modifier types
// ---------------------------------------------------------------------------

export interface IFormModifier {
    modify(form: IFormModel): void;
}

export interface ILayoutModifier {
    row(...fieldIds: string[]): ILayoutNodeHandle;
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
    export type BeforeChange = BeforeChangeCallback;
    export type AfterChange = AfterChangeCallback;
    export type RowNode = IRowNode;
    export type RowNodeVM = IRowNodeVM;
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
    build(name: string): IFieldConfig;
}

export interface ISelectFieldBuilder extends IFieldBuilder {
    options(opts: IValueOption[] | ((form: IFormModel) => IValueOption[])): this;
}

export interface IFieldBuilderRegistry {
    text(): IFieldBuilder;
    select(): ISelectFieldBuilder;
}

export const FormModelFactory = createAbstraction<IFormModelFactory>("FormModelFactory");

export namespace FormModelFactory {
    export type Interface = IFormModelFactory;
    export type Config = IFormModelConfig;
    export type LayoutBuilder = ILayoutBuilder;
    export type FieldBuilder = IFieldBuilder;
    export type SelectFieldBuilder = ISelectFieldBuilder;
    export type FieldBuilderRegistry = IFieldBuilderRegistry;
}
