import { createAbstraction } from "@webiny/feature/admin";
import type { z } from "zod";
import type { Icon } from "~/components/IconPicker/types.js";

// ---------------------------------------------------------------------------
// Renderer registry — augmented by each renderer via declare module
// ---------------------------------------------------------------------------

export interface IFieldRendererRegistry {}

export type FieldRendererName<
    TType extends string = string,
    TOptions extends boolean = boolean
> = string extends TType
    ? keyof IFieldRendererRegistry & string
    : {
          [K in keyof IFieldRendererRegistry]: TType extends IFieldRendererRegistry[K]["fieldType"]
              ? boolean extends TOptions
                  ? K
                  : TOptions extends true
                    ? IFieldRendererRegistry[K] extends { options: true }
                        ? K
                        : never
                    : IFieldRendererRegistry[K] extends { options: true }
                      ? never
                      : K
              : never;
      }[keyof IFieldRendererRegistry] &
          string;

export type FieldRendererSettings<TName extends string> = TName extends keyof IFieldRendererRegistry
    ? IFieldRendererRegistry[TName]["settings"]
    : Record<string, unknown> | undefined;

// ---------------------------------------------------------------------------
// Field types
// ---------------------------------------------------------------------------

export interface IFieldConfig {
    name: string;
    type: string;
    label?: string;
    help?: string;
    description?: string;
    note?: string;
    placeholder?: string;
    defaultValue?: unknown;
    renderer?: string;
    rendererSettings?: Record<string, unknown>;
    isList?: boolean;
    hidden: boolean;
    required: boolean;
    requiredMessage?: string;
    disabled: boolean;
    schema?: z.ZodTypeAny;
    options?: IValueOption[] | ((form: IFormModel) => IValueOption[]);
    normalizeValue?: (value: unknown) => unknown;
    beforeChangeCallbacks?: BeforeChangeCallback[];
    afterChangeCallbacks?: AfterChangeCallback[];
    afterSetValueCallbacks?: AfterSetValueCallback[];
    onBlurCallbacks?: OnBlurCallback[];
    requiredWhenCallbacks?: RequiredWhenCallback[];
    hiddenWhenCallbacks?: HiddenWhenCallback[];
    disabledWhenCallbacks?: DisabledWhenCallback[];
    computed?: ComputedFieldCallback;
    computedUntilDirty?: ComputedFieldCallback;
    tags?: string[];
    cloneValue?: CloneValueCallback;
    rules?: IRule[];
}

export interface IRequiredWhenCallbackConfig {
    fn: (form: IFormModel) => boolean;
    message?: string;
}

export type RequiredWhenCallback = IRequiredWhenCallbackConfig;

export type HiddenWhenCallback = (form: IFormModel) => boolean;

export type DisabledWhenCallback = (form: IFormModel) => boolean;

export type ComputedFieldCallback = (form: IFormModel) => unknown;

// ---------------------------------------------------------------------------
// Rules system
// ---------------------------------------------------------------------------

export type RuleAction = "hide" | "disable";

export type RuleOperator =
    | "eq"
    | "neq"
    | "isEmpty"
    | "isNotEmpty"
    | "isTruthy"
    | "isFalsy"
    | "matches";

export interface IRule {
    type: string;
    target: string;
    operator: RuleOperator | (string & {});
    value: string | null;
    action: RuleAction;
}

export interface IRuleEvaluator {
    canEvaluate(rule: IRule): boolean;
    evaluate(rule: IRule, form: IFormModel): boolean;
}

export interface IValueOption<V extends string | number = string | number> {
    label: string;
    value: V;
    disabled?: boolean;
}

export type OptionValueType<TType extends string> = TType extends "number" ? number : string;

export interface IFieldValidation {
    isValid: boolean | null;
    message?: string;
}

export interface IFieldVM {
    name: string;
    type: string;
    label?: string;
    help?: string;
    description?: string;
    note?: string;
    placeholder?: string;
    value: unknown;
    validation: IFieldValidation;
    validating: boolean;
    required: boolean;
    visible: boolean;
    disabled: boolean;
    renderer?: string;
    rendererSettings?: Record<string, unknown>;
    isList?: boolean;
    options?: IValueOption[];
    onChange: (value: unknown) => void;
    onBlur: () => void;
    addItem: (value?: unknown) => void;
    removeItem: (index: number) => void;
    focusRequested: boolean;
    clearFocusRequest: () => void;
}

export interface IObjectFieldVM extends IFieldVM {
    type: "object";
    isList: boolean;
    /** Child field VMs for non-list object fields. */
    fields: IFieldVM[];
    /**
     * Resolved layout for non-list object fields. For templated objects, resolves
     * against the active template's per-template layout (if registered via
     * `layout.object()`), otherwise defaults to one row per visible child.
     * For list-mode fields, see `items[].layout`.
     */
    layout: LayoutNodeVM[];
    /** Items for list-mode object fields. */
    items: IObjectFieldItemVM[];
    /** Append a new item. Templated lists require a template id. */
    addItem: (value?: unknown) => void;
    moveItem: (fromIndex: number, toIndex: number) => void;
    /** Duplicate a list item (including its `_templateId` when templated) and insert it after the source. */
    duplicateItem: (index: number) => void;
    /** True when the object has templates defined. */
    isTemplated: boolean;
    /** Templates visible in the picker (filtered by each template's reactive `visible`). */
    availableTemplates: ITemplateVM[];
    /** Currently active template id (single-object mode), or null if no template picked. */
    activeTemplateId: string | null;
    /** Switch to a different template. Discards values not present in the new template. */
    setTemplate: (templateId: string) => void;
}

export interface IObjectFieldItemVM {
    key: string;
    fields: IFieldVM[];
    /**
     * Resolved layout for this item. For templated lists, resolves against the
     * item's template-specific layout (if registered via `layout.object()`),
     * otherwise defaults to one row per visible child.
     */
    layout: LayoutNodeVM[];
    remove: () => void;
    moveUp: () => void;
    moveDown: () => void;
    duplicate: () => void;
    /** The template id of this item, if the parent list is templated. */
    templateId?: string;
}

/**
 * VM exposed for each available template in the picker.
 */
export interface ITemplateIcon {
    type: string;
    name: string;
}

export interface ITemplateVM {
    id: string;
    label: string;
    icon?: ITemplateIcon;
}

export interface IField {
    readonly name: string;
    readonly type: string;
    readonly visible: boolean;
    readonly disabled: boolean;
    readonly vm: IFieldVM;
    readonly config: IFieldConfig;
    getValue<T = unknown>(): T;
    setValue(value: unknown): void;
    setValueSilent(value: unknown): void;
    setDisabled(value: boolean): void;
    setVisible(value: boolean): void;
    setForm(form: IFormModel, parentPath?: string): void;
    setAncestorRules(rules: IRule[]): void;
    setValidation(validation: IFieldValidation): void;
    resetValidation(): void;
    validate(options?: { force?: boolean }): Promise<boolean>;
    remove(): void;
    addBeforeChange(cb: BeforeChangeCallback): void;
    addAfterChange(cb: AfterChangeCallback): void;
    addAfterSetValue(cb: AfterSetValueCallback): void;
    addOnBlur(cb: OnBlurCallback): void;
    /**
     * Append a conditional required check. Multiple callbacks chain additively;
     * the first one returning `true` makes the field required for the current
     * form state. The built-in `.required()` flag (if set) always counts as a
     * truthy check and cannot be overridden.
     */
    addRequiredWhen(fn: (form: IFormModel) => boolean, message?: string): void;
    /**
     * Mark this field as a derived value computed from `fn(form)`. The field
     * stays editable (no auto-disable) and is excluded from `isDirty` while
     * still tracking the computed value. Validation continues to apply.
     */
    setComputed(fn: ComputedFieldCallback): void;
    /**
     * Same as `setComputed`, but the field switches to manual mode the first
     * time the user edits its value. After that, the computed callback no
     * longer overrides user input.
     */
    setComputedUntilDirty(fn: ComputedFieldCallback): void;
    blur(): void;
    as<T extends keyof FieldTypeMap>(type: T): FieldTypeMap[T];
    readonly qualifiedName: string;
    focus(): void;
    requestFocus(): void;
    clearFocusRequest(): void;
}

/**
 * Maps field type strings to their typed field interfaces.
 * Extended via module augmentation when new field types are registered.
 */
export interface ITypedField<V> extends IField {
    getValue<T = V>(): T;
}

type InferFieldTypeMap = {
    [K in keyof IFieldBuilderRegistry]: ReturnType<
        IFieldBuilderRegistry[K]
    > extends IObjectFieldBuilder
        ? IObjectField
        : ReturnType<IFieldBuilderRegistry[K]> extends { readonly __valueType?: infer V }
          ? ITypedField<V>
          : IField;
};

export type FieldTypeMap = { [K in keyof InferFieldTypeMap]: InferFieldTypeMap[K] };

export type FileValue = {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    src: string;
    width: number | undefined;
    height: number | undefined;
};

// ---------------------------------------------------------------------------
// Object / List field types
// ---------------------------------------------------------------------------

export interface IObjectFieldConfig extends IFieldConfig {
    childBuilders: Record<string, IFieldBuilder>;
    isList: boolean;
    listSchema?: z.ZodTypeAny;
    templates?: ITemplateConfig[];
}

export interface ITemplateBuilder {
    label(text: string): this;
    icon(icon: ITemplateIcon): this;
    fields(factory: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder>): this;
    visible(predicate: (form: IFormModel) => boolean): this;
}

export interface ITemplateConfig {
    id: string;
    label: string;
    icon?: ITemplateIcon;
    childBuilders: Record<string, IFieldBuilder>;
    visible?: (form: IFormModel) => boolean;
}

export interface IObjectField extends ITypedField<Record<string, unknown> | null> {
    readonly isList: boolean;
    readonly children: Map<string, IField>;
    readonly items: IListItemField[];
    readonly isTemplated: boolean;
    readonly activeTemplateId: string | null;
    readonly availableTemplates: ITemplateVM[];
    /**
     * Add, replace, or remove children on this object field at runtime.
     * Mirrors `form.fields()` but scoped to this object's children. Existing
     * keys are replaced; new keys are appended; passing `undefined` removes.
     * Throws on templated objects — each template owns its own fields.
     */
    fields(
        factory: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder | undefined>
    ): void;
    /**
     * Register an inner layout used by the field's VM (`field.layout` for
     * single objects, `item.layout` for list items).
     *
     * Pass `LayoutNode[]` for non-templated objects (the layout applies to the
     * single object or every list item). Pass `Record<templateId, LayoutNode[]>`
     * for templated objects (each entry applies when that template is active
     * or for each list item with that template). Templates without an entry
     * fall back to default one-row-per-visible-child.
     */
    setInnerLayout(layout: LayoutNode[] | Record<string, LayoutNode[]>): void;
    /**
     * Append a new list item.
     * - Non-templated list: `addItem(data?)` — data hydrates the new item.
     * - Templated list: `addItem(templateId, data?)` — templateId picks the variant.
     */
    addItem(
        templateIdOrData?: string | Record<string, unknown>,
        data?: Record<string, unknown>
    ): void;
    removeItem(index: number): void;
    moveItem(fromIndex: number, toIndex: number): void;
    /** Duplicate a list item (including its `_templateId`) and insert after the source. */
    duplicateItem(index: number): void;
    setTemplate(templateId: string): void;
    /**
     * Runtime template management. Available on every object field but throws
     * when called on a non-templated field (`isTemplated === false`).
     */
    readonly templates: IObjectFieldTemplates;
    getInnerLayout(): LayoutNode[] | null;
    getData(): Record<string, unknown> | Record<string, unknown>[];
}

export interface IObjectFieldTemplates {
    add(id: string, configure: (t: ITemplateBuilder) => void): void;
    remove(templateId: string): void;
}

export interface IListItemField {
    readonly key: string;
    readonly children: Map<string, IField>;
    readonly templateId?: string;
    getData(): Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Callback types
// ---------------------------------------------------------------------------

export type BeforeChangeCallback = (value: unknown, form: IFormModel) => unknown;
export type AfterChangeCallback = (value: unknown, form: IFormModel) => void;
export type AfterSetValueCallback = (value: unknown, form: IFormModel) => void;
export type OnBlurCallback = (value: unknown, form: IFormModel) => void;
export type CloneValueCallback = (value: unknown) => unknown;

// ---------------------------------------------------------------------------
// Layout types
// ---------------------------------------------------------------------------

export type LayoutNode = IRowNode | ISeparatorNode | ITabsNode | IElementNode | IObjectNode;

export interface IRowNode {
    type: "row";
    fieldIds: string[];
    position?: LayoutPosition;
}

/** @deprecated Use IRowBuilder instead */
export type IRowNodeHandle = IRowBuilder;

export interface ISeparatorNode {
    type: "separator";
}

export interface ITabDefinition {
    id: string;
    label: string;
    description?: string;
    icon?: Icon;
    layout: LayoutNode[];
    rules?: IRule[];
}

/**
 * User-facing tab spec accepted by `layout.tabs(...)`. The layout is supplied
 * as a callback receiving the layout builder, mirroring `layout.object(...)`.
 * Resolved to `ITabDefinition` (with `layout: LayoutNode[]`) at build time.
 */
export interface ITabDefinitionInput {
    id: string;
    label: string;
    description?: string;
    icon?: Icon;
    layout: (layout: ILayoutBuilder) => ILayoutNodeBuilder[];
    rules?: IRule[];
}

export interface ITabsNode {
    type: "tabs";
    id?: string;
    renderer?: string;
    rendererSettings?: Record<string, unknown>;
    tabs: ITabDefinition[];
    rules?: IRule[];
}

export interface IElementNode {
    type: "element";
    id?: string;
    renderer: string;
    props?: Record<string, unknown>;
}

/**
 * Layout node that references an object field and registers an inner layout
 * on it. Resolved as a single-field row in the outer layout — the inner
 * layout is exposed on the field's VM (`field.layout` for single objects,
 * `item.layout` for list items).
 *
 * - For non-templated objects, `inner` is `LayoutNode[]` (one layout, applied
 *   to the single object or every list item).
 * - For templated objects, `inner` is `Record<templateId, LayoutNode[]>` —
 *   each entry is the layout used when that template is active (or for each
 *   list item with that template).
 */
export interface IObjectNode {
    type: "object";
    fieldName: string;
    inner: LayoutNode[] | Record<string, LayoutNode[]>;
}

// ---------------------------------------------------------------------------
// Layout node builders
// ---------------------------------------------------------------------------

export interface ILayoutNodeBuilder {
    build(): LayoutNode;
}

export interface IRowBuilder extends ILayoutNodeBuilder {
    before(target: string): IRowBuilder;
    after(target: string): IRowBuilder;
    build(): IRowNode;
}

export interface ISeparatorBuilder extends ILayoutNodeBuilder {
    build(): ISeparatorNode;
}

export interface ITabBuilder {
    label(text: string): this;
    description(text: string): this;
    icon(icon: Icon): this;
    layout(factory: (l: ILayoutBuilder) => ILayoutNodeBuilder[]): this;
    rules(rules: IRule[]): this;
}

export interface ITabsBuilder extends ILayoutNodeBuilder {
    renderer(name: string, settings?: Record<string, unknown>): this;
    tab(id: string, configure: (tab: ITabBuilder) => void): this;
    before(target: string): this;
    after(target: string): this;
    rules(rules: IRule[]): this;
    build(): ITabsNode;
}

export interface IElementBuilder extends ILayoutNodeBuilder {
    build(): IElementNode;
}

export interface IObjectBuilder extends ILayoutNodeBuilder {
    build(): IObjectNode;
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
    icon?: Icon;
    hasErrors: boolean;
    disabled: boolean;
    layout: LayoutNodeVM[];
}

export interface ITabsNodeVM {
    type: "tabs";
    id?: string;
    renderer?: string;
    rendererSettings?: Record<string, unknown>;
    tabs: ITabDefinitionVM[];
    disabled: boolean;
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

export interface LayoutNodeHandleMap {
    tabs: ITabsBuilder;
    element: IElementNode;
    object: IObjectNode;
}

export interface ILayoutNodeAccessHandle {
    as<T extends keyof LayoutNodeHandleMap>(type: T): LayoutNodeHandleMap[T];
}

/** @deprecated Use ITabsBuilder instead */
export type ITabsHandle = ITabsBuilder;

/** @deprecated Use ITabBuilder instead */
export type ITabHandle = ITabBuilder;

// ---------------------------------------------------------------------------
// Modifier types
// ---------------------------------------------------------------------------

export interface IFormModifier {
    modify(form: IFormModel): void;
}

export interface ILayoutModifier {
    row(...fieldIds: string[]): ILayoutNodeHandle;
    separator(): ILayoutNodeHandle;
    tabs(config: {
        id?: string;
        renderer?: string;
        tabs: ITabDefinitionInput[];
        rules?: IRule[];
    }): ILayoutNodeHandle;
    element(renderer: string, props?: Record<string, unknown>): ILayoutNodeHandle;
    object(
        fieldName: string,
        layout: (layout: ILayoutBuilder) => ILayoutNodeBuilder[]
    ): ILayoutNodeHandle;
    object(
        fieldName: string,
        templateLayouts: Record<string, (layout: ILayoutBuilder) => ILayoutNodeBuilder[]>
    ): ILayoutNodeHandle;
    remove(target: string): void;
}

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

export interface IFormError {
    path: string;
    label?: string;
    breadcrumb?: string[];
    message: string;
}

export interface IFormVM {
    layout: LayoutNodeVM[];
    errors: IFormError[];
    hasErrors: boolean;
    isDirty: boolean;
    isValid: boolean | null;
    submitCount: number;
    focusField(path: string): void;
    getData(): Record<string, unknown>;
    setData(data: Record<string, unknown>): void;
}

/**
 * Imperative form-level rule. Receives the live form and may return a flat
 * list of errors (sync or async). Errors are merged into `form.errors` and
 * surfaced on per-field validation when their `path` matches a known field.
 */
export type FormRuleFn = (
    form: IFormModel
) => IFormError[] | undefined | void | Promise<IFormError[] | undefined | void>;

/**
 * A form-level rule. Either a Zod schema (validated against `form.getData()`)
 * or an imperative function returning an error list.
 */
export type FormRule = z.ZodTypeAny | FormRuleFn;

export interface IFormModel<T = Record<string, any>> {
    field(name: string): IField;
    fields(
        factory: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder | undefined>
    ): void;
    layout(factory: (layout: ILayoutModifier) => (LayoutNode | IPositionedLayoutNode)[]): void;
    layout(nodeId: string): ILayoutNodeAccessHandle;
    /**
     * Replace the entire layout. Re-registers per-field inner layouts and
     * propagates ancestor rules. Use `layout()` (modifier form) for additive
     * changes.
     */
    setLayout(factory: (layout: ILayoutBuilder) => ILayoutNodeBuilder[]): void;
    /**
     * Append a form-level validation rule. Runs after per-field validation.
     * Accepts a Zod schema (validated against `getData()`) or an imperative
     * function returning a list of errors.
     */
    addRule(rule: FormRule): void;
    getData(): T;
    setData(data: T): void;
    reset(): void;
    validate(): Promise<boolean>;
    submit<T = Record<string, unknown>>(options?: { skipValidation?: boolean }): Promise<T | false>;
    evaluateRules(rules: IRule[] | undefined): { visible: boolean; disabled: boolean };
    focusField(name: string): void;
    readonly isDirty: boolean;
    readonly isValid: boolean | null;
    readonly submitted: boolean;
    readonly submitCount: number;
    readonly errors: IFormError[];
    readonly vm: IFormVM;
    getFieldBuilders(predicate?: (builder: IFieldBuilder) => boolean): IFieldBuilder[];
    resolveChildLayout(layout: LayoutNode[], children: Map<string, IField>): LayoutNodeVM[];
    readonly registry: IFieldBuilderRegistry;
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
    export type ObjectField = IObjectField;
    export type ObjectFieldConfig = IObjectFieldConfig;
    export type BeforeChange = BeforeChangeCallback;
    export type AfterChange = AfterChangeCallback;
    export type AfterSetValue = AfterSetValueCallback;
    export type OnBlur = OnBlurCallback;
    export type CloneValue = CloneValueCallback;
    export type LayoutNodeBuilder = ILayoutNodeBuilder;
    export type RowBuilder = IRowBuilder;
    export type SeparatorBuilder = ISeparatorBuilder;
    export type TabBuilder = ITabBuilder;
    export type TabsBuilder = ITabsBuilder;
    export type ElementBuilder = IElementBuilder;
    export type ObjectBuilder = IObjectBuilder;
    export type RowNode = IRowNode;
    /** @deprecated Use RowBuilder instead */
    export type RowNodeHandle = IRowNodeHandle;
    export type RowNodeVM = IRowNodeVM;
    export type SeparatorNode = ISeparatorNode;
    export type SeparatorNodeVM = ISeparatorNodeVM;
    export type TabsNode = ITabsNode;
    export type TabDefinition = ITabDefinition;
    export type TabDefinitionInput = ITabDefinitionInput;
    export type TabsNodeVM = ITabsNodeVM;
    export type TabDefinitionVM = ITabDefinitionVM;
    export type TabIcon = Icon;
    export type ElementNode = IElementNode;
    export type ElementNodeVM = IElementNodeVM;
    export type ObjectNode = IObjectNode;
    export type ObjectFieldVM = IObjectFieldVM;
    export type ObjectFieldItemVM = IObjectFieldItemVM;
    export type TemplateBuilder = ITemplateBuilder;
    export type TemplateConfig = ITemplateConfig;
    export type TemplateIcon = ITemplateIcon;
    export type TemplateVM = ITemplateVM;
    export type ObjectFieldTemplatesAPI = IObjectFieldTemplates;
    export type FormError = IFormError;
    export type FormVM = IFormVM;
    export type Interface<T = Record<string, any>> = IFormModel<T>;
    export type Modifier = IFormModifier;
    export type LayoutModifier = ILayoutModifier;
    export type Rule = IRule;
    export type Action = RuleAction;
    export type RuleEvaluator = IRuleEvaluator;
    export type FormRuleFunction = FormRuleFn;
    export type FormRuleType = FormRule;
    export type RequiredWhen = (form: IFormModel) => boolean;
    export type HiddenWhen = HiddenWhenCallback;
    export type DisabledWhen = DisabledWhenCallback;
    export type Computed = ComputedFieldCallback;
}

// ---------------------------------------------------------------------------
// FormModelFactory abstraction
// ---------------------------------------------------------------------------

export interface IFormModelFactory {
    create<T = Record<string, any>>(config: IFormModelConfig): IFormModel<T>;
}

export interface IFormModelConfig {
    fields: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder>;
    layout?: (layout: ILayoutBuilder) => ILayoutNodeBuilder[];
    validateOnSubmit?: boolean;
    ruleEvaluators?: IRuleEvaluator[];
}

export interface ILayoutBuilder {
    row(...fieldIds: string[]): IRowBuilder;
    separator(): ISeparatorBuilder;
    tabs(id?: string): ITabsBuilder;
    element(renderer: string, props?: Record<string, unknown>): IElementBuilder;
    /**
     * Reference an object field and register its inner layout.
     *
     * Non-templated: pass a single layout factory; the layout applies to the
     * single object or to every list item. Templated: pass a map of factories
     * keyed by template id; each entry applies when that template is active
     * (or for each list item with that template). Templates without an entry
     * fall back to default one-row-per-visible-child.
     */
    object(
        fieldName: string,
        layout: (layout: ILayoutBuilder) => ILayoutNodeBuilder[]
    ): IObjectBuilder;
    object(
        fieldName: string,
        templateLayouts: Record<string, (layout: ILayoutBuilder) => ILayoutNodeBuilder[]>
    ): IObjectBuilder;
}

export interface IFieldBuilder<
    TType extends string = string,
    TOptions extends boolean = false,
    TValue = unknown
> {
    readonly __valueType?: TValue;
    label(text: string): this;
    help(text: string): this;
    description(text: string): this;
    note(text: string): this;
    placeholder(text: string): this;
    schema(zodSchema: z.ZodTypeAny): this;
    defaultValue(value: unknown): this;
    renderer<TName extends FieldRendererName<TType, TOptions>>(
        name: TName,
        ...args: undefined extends FieldRendererSettings<TName>
            ? [settings?: FieldRendererSettings<TName>]
            : FieldRendererSettings<TName> extends undefined
              ? []
              : [settings: FieldRendererSettings<TName>]
    ): this;
    hidden(): this;
    hiddenWhen(fn: (form: IFormModel) => boolean): this;
    disabledWhen(fn: (form: IFormModel) => boolean): this;
    required(message?: string): this;
    /**
     * Conditional required check. Multiple `requiredWhen()` calls chain — the
     * first one to return `true` for the current form state makes the field
     * required. Built-in `.required()` (if set) is evaluated alongside.
     */
    requiredWhen(fn: (form: IFormModel) => boolean, message?: string): this;
    list(): this;
    disabled(value?: boolean): this;
    rules(rules: IRule[]): this;
    beforeChange(fn: BeforeChangeCallback): this;
    afterChange(fn: AfterChangeCallback): this;
    afterSetValue(fn: AfterSetValueCallback): this;
    onBlur(fn: OnBlurCallback): this;
    cloneValue(fn: CloneValueCallback): this;
    getTags(): string[];
    tags(tags: string[]): this;
    /**
     * Mark this field as a derived value computed from `fn(form)`. The field
     * stays editable; user edits are accepted but the computed value continues
     * to flow whenever a dependency changes. To make the user "win", use
     * `computedUntilDirty()` instead.
     */
    computed(fn: ComputedFieldCallback): this;
    /**
     * Same as `computed`, but the field switches to manual mode the first time
     * its value is changed via the UI. After that, `fn(form)` no longer
     * overrides user input.
     */
    computedUntilDirty(fn: ComputedFieldCallback): this;
    build(name: string): IFieldConfig;
}

export interface IOptionsFieldBuilder<TType extends string, TValue = unknown> extends IFieldBuilder<
    TType,
    false,
    TValue
> {
    options(
        opts:
            | IValueOption<OptionValueType<TType>>[]
            | ((form: IFormModel) => IValueOption<OptionValueType<TType>>[])
    ): IFieldBuilder<TType, true, TValue>;
}

export interface IObjectFieldBuilder extends IFieldBuilder<
    "object",
    false,
    Record<string, unknown> | null
> {
    fields(fn: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder>): this;
    list(): this;
    listSchema(schema: z.ZodTypeAny): this;
    template(id: string, configure: (t: ITemplateBuilder) => void): this;
}

export interface IFieldBuilderRegistry {}

// ---------------------------------------------------------------------------
// Field type plugin system
// ---------------------------------------------------------------------------

export interface IFieldTypeFactory {
    readonly type: string;
    create(registry: IFieldBuilderRegistry): IFieldBuilder;
}

export const FieldType = createAbstraction<IFieldTypeFactory>("FormModel/FieldType");

export namespace FieldType {
    export type Interface = IFieldTypeFactory;
    export type FieldBuilder = IFieldBuilder;
    export type FieldBuilderRegistry = IFieldBuilderRegistry;
}

export const FieldBuilderRegistry = createAbstraction<IFieldBuilderRegistry>(
    "FormModel/FieldBuilderRegistry"
);

export namespace FieldBuilderRegistry {
    export type Interface = IFieldBuilderRegistry;
}

export const FormModelFactory = createAbstraction<IFormModelFactory>("FormModelFactory");

export namespace FormModelFactory {
    export type Interface = IFormModelFactory;
    export type Config = IFormModelConfig;
    export type LayoutBuilder = ILayoutBuilder;
    export type FieldBuilder = IFieldBuilder;
    export type OptionsFieldBuilder<TType extends string> = IOptionsFieldBuilder<TType>;
    export type ObjectFieldBuilder = IObjectFieldBuilder;
    export type FieldBuilderRegistry = IFieldBuilderRegistry;
}

export const RuleEvaluator = createAbstraction<IRuleEvaluator>("FormModelRuleEvaluator");

export namespace RuleEvaluator {
    export type Interface = IRuleEvaluator;
    export type Rule = IRule;
    export type Action = RuleAction;
}
