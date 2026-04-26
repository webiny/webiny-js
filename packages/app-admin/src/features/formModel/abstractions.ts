import { createAbstraction } from "@webiny/feature/admin";
import type { z } from "zod";

// ---------------------------------------------------------------------------
// Renderer registry — augmented by each renderer via declare module
// ---------------------------------------------------------------------------

export interface IFieldRendererRegistry {}

export type FieldRendererName<TType extends string = string> = string extends TType
    ? keyof IFieldRendererRegistry & string
    : {
          [K in keyof IFieldRendererRegistry]: TType extends IFieldRendererRegistry[K]["fieldType"]
              ? K
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
    requiredWhenCallbacks?: RequiredWhenCallback[];
    computed?: ComputedFieldCallback;
    computedUntilDirty?: ComputedFieldCallback;
    rules?: IRule[];
}

export interface IRequiredWhenCallbackConfig {
    fn: (form: IFormModel) => boolean;
    message?: string;
}

export type RequiredWhenCallback = IRequiredWhenCallbackConfig;

export type ComputedFieldCallback = (form: IFormModel) => unknown;

// ---------------------------------------------------------------------------
// Rules system
// ---------------------------------------------------------------------------

export type RuleAction = "hide" | "disable";

export interface IRule {
    type: string;
    target: string;
    operator: string;
    value: string | null;
    action: RuleAction;
}

export interface IRuleEvaluator {
    canEvaluate(rule: IRule): boolean;
    evaluate(rule: IRule, form: IFormModel): boolean;
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
    help?: string;
    description?: string;
    note?: string;
    placeholder?: string;
    value: unknown;
    validation: IFieldValidation;
    required: boolean;
    visible: boolean;
    disabled: boolean;
    renderer?: string;
    rendererSettings?: Record<string, unknown>;
    options?: IValueOption[];
    onChange: (value: unknown) => void;
    onBlur: () => void;
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
    addItem: (templateId?: string) => void;
    removeItem: (index: number) => void;
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
export interface ITemplateVM {
    id: string;
    name: string;
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
    setForm(form: IFormModel): void;
    setAncestorRules(rules: IRule[]): void;
    setValidation(validation: IFieldValidation): void;
    resetValidation(): void;
    validate(): Promise<boolean>;
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
    templates?: ITemplateConfig[];
}

/**
 * Template definition on an object field.
 * A template is an atomic, named variant of the object's children.
 *
 * Modifiers may add or remove whole templates but cannot mutate a template's fields piecemeal.
 */
export interface ITemplate {
    id: string;
    name: string;
    fields: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder>;
    /**
     * Reactive callback — when false, the template is hidden from the picker.
     * Does not retroactively hide existing items/data.
     */
    visible?: (form: IFormModel) => boolean;
}

/**
 * Resolved template config (post-build) — `fields` has been materialised into builders.
 */
export interface ITemplateConfig {
    id: string;
    name: string;
    childBuilders: Record<string, IFieldBuilder>;
    visible?: (form: IFormModel) => boolean;
}

export interface IObjectField extends IField {
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
    readonly templates: IObjectFieldTemplatesAPI;
    getData(): Record<string, unknown> | Record<string, unknown>[];
}

export interface IObjectFieldTemplatesAPI {
    /**
     * Append a new template. Throws on duplicate id or reserved `_templateId`.
     * Throws when called on a non-templated object field.
     */
    add(template: ITemplate): void;
    /**
     * Remove a template by id. No-op if the id does not exist.
     * - Single-object templated field: clears active template if it matches.
     * - Templated list: drops list items whose `_templateId` matches.
     * - Layout entries for the removed id are kept silently and reused if the
     *   id is later re-added.
     * Throws when called on a non-templated object field.
     */
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

// ---------------------------------------------------------------------------
// Layout types
// ---------------------------------------------------------------------------

export type LayoutNode = IRowNode | ISeparatorNode | ITabsNode | IElementNode | IObjectNode;

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
    rules?: IRule[];
}

export interface ITabsNode {
    type: "tabs";
    id?: string;
    renderer?: string;
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
    disabled: boolean;
    layout: LayoutNodeVM[];
}

export interface ITabsNodeVM {
    type: "tabs";
    id?: string;
    renderer?: string;
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
    tabs(config: {
        id?: string;
        renderer?: string;
        tabs: ITabDefinition[];
        rules?: IRule[];
    }): ILayoutNodeHandle;
    element(renderer: string, props?: Record<string, unknown>): ILayoutNodeHandle;
    object(fieldName: string, layout: (layout: ILayoutBuilder) => LayoutNode[]): ILayoutNodeHandle;
    object(
        fieldName: string,
        templateLayouts: Record<string, (layout: ILayoutBuilder) => LayoutNode[]>
    ): ILayoutNodeHandle;
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
    setLayout(factory: (layout: ILayoutBuilder) => LayoutNode[]): void;
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
    submit<T = Record<string, unknown>>(): Promise<T | false>;
    evaluateRules(rules: IRule[] | undefined): { visible: boolean; disabled: boolean };
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
    export type ObjectNode = IObjectNode;
    export type ObjectFieldVM = IObjectFieldVM;
    export type ObjectFieldItemVM = IObjectFieldItemVM;
    export type Template = ITemplate;
    export type TemplateConfig = ITemplateConfig;
    export type TemplateVM = ITemplateVM;
    export type ObjectFieldTemplatesAPI = IObjectFieldTemplatesAPI;
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
    layout?: (layout: ILayoutBuilder) => LayoutNode[];
    validateOnSubmit?: boolean;
    ruleEvaluators?: IRuleEvaluator[];
}

export interface ILayoutBuilder {
    row(...fieldIds: string[]): IRowNode;
    separator(): ISeparatorNode;
    tabs(config: {
        id?: string;
        renderer?: string;
        tabs: ITabDefinition[];
        rules?: IRule[];
    }): ITabsNode;
    element(renderer: string, props?: Record<string, unknown>): IElementNode;
    /**
     * Reference an object field and register its inner layout.
     *
     * Non-templated: pass a single layout factory; the layout applies to the
     * single object or to every list item. Templated: pass a map of factories
     * keyed by template id; each entry applies when that template is active
     * (or for each list item with that template). Templates without an entry
     * fall back to default one-row-per-visible-child.
     */
    object(fieldName: string, layout: (layout: ILayoutBuilder) => LayoutNode[]): IObjectNode;
    object(
        fieldName: string,
        templateLayouts: Record<string, (layout: ILayoutBuilder) => LayoutNode[]>
    ): IObjectNode;
}

export interface IFieldBuilder<TType extends string = string> {
    label(text: string): this;
    help(text: string): this;
    description(text: string): this;
    note(text: string): this;
    placeholder(text: string): this;
    schema(zodSchema: z.ZodTypeAny): this;
    defaultValue(value: unknown): this;
    renderer<TName extends FieldRendererName<TType>>(
        name: TName,
        ...args: undefined extends FieldRendererSettings<TName>
            ? [settings?: FieldRendererSettings<TName>]
            : FieldRendererSettings<TName> extends undefined
              ? []
              : [settings: FieldRendererSettings<TName>]
    ): this;
    hidden(): this;
    required(message?: string): this;
    /**
     * Conditional required check. Multiple `requiredWhen()` calls chain — the
     * first one to return `true` for the current form state makes the field
     * required. Built-in `.required()` (if set) is evaluated alongside.
     */
    requiredWhen(fn: (form: IFormModel) => boolean, message?: string): this;
    disabled(value?: boolean): this;
    rules(rules: IRule[]): this;
    beforeChange(fn: BeforeChangeCallback): this;
    afterChange(fn: AfterChangeCallback): this;
    afterSetValue(fn: AfterSetValueCallback): this;
    onBlur(fn: OnBlurCallback): this;
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

export interface ISelectFieldBuilder extends IFieldBuilder<"select"> {
    options(opts: IValueOption[] | ((form: IFormModel) => IValueOption[])): this;
}

export interface IObjectFieldBuilder extends IFieldBuilder<"object"> {
    fields(fn: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder>): this;
    list(): this;
    listSchema(schema: z.ZodTypeAny): this;
    templates(templates: ITemplate[]): this;
}

export interface IFieldBuilderRegistry {
    text(): IFieldBuilder<"text">;
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

export const RuleEvaluator = createAbstraction<IRuleEvaluator>("FormModelRuleEvaluator");

export namespace RuleEvaluator {
    export type Interface = IRuleEvaluator;
    export type Rule = IRule;
    export type Action = RuleAction;
}
