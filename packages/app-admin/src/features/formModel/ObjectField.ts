import { makeAutoObservable, runInAction, toJS } from "mobx";
import { Field } from "./Field.js";
import type {
    IObjectFieldConfig,
    IObjectField,
    IObjectFieldTemplatesAPI,
    IListItemField,
    IField,
    IObjectFieldVM,
    IFieldValidation,
    IFormModel,
    IFieldBuilder,
    IFieldBuilderRegistry,
    IRule,
    ITemplate,
    ITemplateConfig,
    ITemplateVM,
    FieldTypeMap,
    LayoutNode,
    LayoutNodeVM,
    BeforeChangeCallback,
    AfterChangeCallback,
    AfterSetValueCallback,
    OnBlurCallback,
    ComputedFieldCallback
} from "./abstractions.js";
import type { FormModel } from "./FormModel.js";

/** Reserved key used as the template discriminator in templated object data. */
export const TEMPLATE_DISCRIMINATOR = "_templateId";

function createChildFields(
    childBuilders: Record<string, IFieldBuilder>,
    form: IFormModel | null,
    parentPath?: string
): Map<string, IField> {
    const children = new Map<string, IField>();
    for (const [name, builder] of Object.entries(childBuilders)) {
        const config = builder.build(name);
        const field = createFieldFromConfig(config, form, parentPath);
        children.set(name, field);
    }
    return children;
}

function createFieldFromConfig(config: any, form: IFormModel | null, parentPath?: string): IField {
    if (config.childBuilders) {
        const objField = new ObjectField(config as IObjectFieldConfig);
        if (form) {
            objField.setForm(form, parentPath);
        }
        return objField;
    }
    const field = new Field(config);
    if (form) {
        field.setForm(form, parentPath);
    }
    return field;
}

function hydrateChildren(
    children: Map<string, IField>,
    data: Record<string, unknown> | null | undefined,
    options?: { clone?: boolean }
): void {
    if (!data) {
        return;
    }
    for (const [name, field] of children) {
        if (name in data) {
            if (options?.clone && field.config.cloneValue) {
                field.setValueSilent(field.config.cloneValue(data[name]));
            } else {
                field.setValueSilent(data[name]);
            }
        }
    }
}

function getChildrenData(children: Map<string, IField>): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const [name, field] of children) {
        if (isObjectField(field)) {
            data[name] = toJS(field.getData());
        } else {
            data[name] = toJS(field.getValue());
        }
    }
    return data;
}

async function validateChildren(
    children: Map<string, IField>,
    options?: { force?: boolean }
): Promise<boolean> {
    let allValid = true;
    for (const [, field] of children) {
        const valid = await field.validate(options);
        if (!valid) {
            allValid = false;
        }
    }
    return allValid;
}

export function isObjectField(field: IField): field is ObjectField {
    return field.type === "object";
}

let itemKeyCounter = 0;

interface ListItem {
    key: string;
    children: Map<string, IField>;
    templateId?: string;
}

/**
 * ObjectField — hierarchical field with children, using composition.
 * Holds a `_base` Field for scalar behavior (callbacks, disabled/hidden, form ref).
 * Adds its own children/items management for object and list modes.
 */
export class ObjectField implements IObjectField {
    readonly config: IObjectFieldConfig;

    private _base: Field;
    private _form: IFormModel | null = null;
    private _children: Map<string, IField>;
    private _items: ListItem[] = [];
    private _templates: ITemplateConfig[] = [];
    private _isTemplated: boolean;
    private _activeTemplateId: string | null = null;
    /** Inner layout for non-templated objects (single layout, applied per item too). */
    private _ownLayout: LayoutNode[] | null = null;
    /** Per-template inner layouts for templated objects. */
    private _templateLayouts: Record<string, LayoutNode[]> = {};
    private _validating = false;

    constructor(config: IObjectFieldConfig) {
        this.config = config;
        this._base = new Field({
            ...config,
            type: "object",
            renderer:
                config.renderer ??
                (config.isList ? "objectAccordionMultiple" : "objectAccordionSingle")
        });
        this._templates = config.templates ?? [];
        this._isTemplated = this._templates.length > 0;

        if (this._isTemplated) {
            // Templated mode: children populated per-item (list) or when a template is picked (single).
            this._children = new Map();
        } else {
            this._children = createChildFields(config.childBuilders, null);
        }

        makeAutoObservable(this, {
            config: false
        });
    }

    private _findTemplate(id: string): ITemplateConfig | undefined {
        return this._templates.find(t => t.id === id);
    }

    private _rebuildChildrenForTemplate(templateId: string): void {
        const template = this._findTemplate(templateId);
        if (!template) {
            throw new Error(
                `Template "${templateId}" not found on field "${this.config.name}". ` +
                    `Available: ${this._templates.map(t => t.id).join(", ") || "(none)"}.`
            );
        }
        const children = createChildFields(template.childBuilders, this._form, this.qualifiedName);
        this._children = children;
        this._activeTemplateId = templateId;
        const inner = this._innerLayoutFor(templateId);
        if (inner) {
            this._applyNestedObjectLayouts(inner, children);
        }
    }

    // --- Forwarded from _base ---

    get name(): string {
        return this._base.name;
    }

    get type(): string {
        return "object";
    }

    get visible(): boolean {
        return this._base.visible;
    }

    get disabled(): boolean {
        return this._base.disabled;
    }

    setDisabled(value: boolean): void {
        this._base.setDisabled(value);
    }

    setVisible(value: boolean): void {
        this._base.setVisible(value);
    }

    setAncestorRules(rules: IRule[]): void {
        this._base.setAncestorRules(rules);
    }

    setForm(form: IFormModel, parentPath?: string): void {
        this._form = form;
        this._base.setForm(form, parentPath);
        const myPath = this._base.qualifiedName;
        for (const [, field] of this._children) {
            field.setForm(form, myPath);
        }
        for (const item of this._items) {
            for (const [, field] of item.children) {
                field.setForm(form, myPath);
            }
        }
    }

    setValidation(validation: IFieldValidation): void {
        this._base.setValidation(validation);
    }

    addBeforeChange(cb: BeforeChangeCallback): void {
        this._base.addBeforeChange(cb);
    }

    addAfterChange(cb: AfterChangeCallback): void {
        this._base.addAfterChange(cb);
    }

    addAfterSetValue(cb: AfterSetValueCallback): void {
        this._base.addAfterSetValue(cb);
    }

    addOnBlur(cb: OnBlurCallback): void {
        this._base.addOnBlur(cb);
    }

    addRequiredWhen(fn: (form: IFormModel) => boolean, message?: string): void {
        this._base.addRequiredWhen(fn, message);
    }

    setComputed(fn: ComputedFieldCallback): void {
        this._base.setComputed(fn);
    }

    setComputedUntilDirty(fn: ComputedFieldCallback): void {
        this._base.setComputedUntilDirty(fn);
    }

    blur(): void {
        this._base.blur();
    }

    remove(): void {
        this._base.remove();
    }

    get qualifiedName(): string {
        return this._base.qualifiedName;
    }

    focus(): void {
        this._base.focus();
    }

    requestFocus(): void {
        this._base.requestFocus();
    }

    clearFocusRequest(): void {
        this._base.clearFocusRequest();
    }

    getInnerLayout(): LayoutNode[] | null {
        if (this.isTemplated) {
            return this._activeTemplateId
                ? (this._templateLayouts[this._activeTemplateId] ?? null)
                : null;
        }
        return this._ownLayout;
    }

    // --- Object-specific ---

    get isList(): boolean {
        return this.config.isList;
    }

    get isTemplated(): boolean {
        return this._isTemplated;
    }

    get activeTemplateId(): string | null {
        return this._activeTemplateId;
    }

    get availableTemplates(): ITemplateVM[] {
        const result: ITemplateVM[] = [];
        for (const template of this._templates) {
            if (template.visible && this._form) {
                if (!template.visible(this._form)) {
                    continue;
                }
            }
            result.push({ id: template.id, name: template.name, icon: template.icon });
        }
        return result;
    }

    setTemplate(templateId: string): void {
        if (this._activeTemplateId === templateId) {
            return;
        }
        this._rebuildChildrenForTemplate(templateId);
    }

    get templates(): IObjectFieldTemplatesAPI {
        return {
            add: (template: ITemplate) => this._addTemplate(template),
            remove: (templateId: string) => this._removeTemplate(templateId)
        };
    }

    private _addTemplate(template: ITemplate): void {
        if (!this.isTemplated) {
            throw new Error(
                `Object field "${this.config.name}" is not templated; templates.add() requires the field to be defined with .templates([...]).`
            );
        }
        if (template.id === TEMPLATE_DISCRIMINATOR) {
            throw new Error(
                `Template id "${TEMPLATE_DISCRIMINATOR}" is reserved. Choose a different id.`
            );
        }
        if (this._findTemplate(template.id)) {
            throw new Error(`Duplicate template id "${template.id}".`);
        }
        const childBuilders = template.fields((this._form as FormModel).registry);
        if (TEMPLATE_DISCRIMINATOR in childBuilders) {
            throw new Error(
                `Template "${template.id}" defines a reserved field "${TEMPLATE_DISCRIMINATOR}". ` +
                    `The discriminator is added automatically.`
            );
        }
        this._templates.push({
            id: template.id,
            name: template.name,
            icon: template.icon,
            childBuilders,
            visible: template.visible
        });
    }

    private _removeTemplate(templateId: string): void {
        if (!this.isTemplated) {
            throw new Error(
                `Object field "${this.config.name}" is not templated; templates.remove() requires the field to be defined with .templates([...]).`
            );
        }
        const index = this._templates.findIndex(t => t.id === templateId);
        if (index === -1) {
            return;
        }
        this._templates.splice(index, 1);

        if (this.config.isList) {
            this._items = this._items.filter(item => item.templateId !== templateId);
            return;
        }
        if (this._activeTemplateId === templateId) {
            this._activeTemplateId = null;
            this._children = new Map();
        }
    }

    setInnerLayout(layout: LayoutNode[] | Record<string, LayoutNode[]>): void {
        if (Array.isArray(layout)) {
            if (this.isTemplated) {
                throw new Error(
                    `Object field "${this.config.name}" is templated; layout.object() must pass a per-template map (Record<templateId, LayoutNode[]>), not a single LayoutNode[].`
                );
            }
            this._ownLayout = layout;
            this._templateLayouts = {};
            // Apply nested object layouts to children that already exist
            // (non-templated single + non-templated list items).
            this._applyNestedObjectLayouts(layout, this._children);
            for (const item of this._items) {
                this._applyNestedObjectLayouts(layout, item.children);
            }
            return;
        }
        if (!this.isTemplated) {
            throw new Error(
                `Object field "${this.config.name}" is not templated; layout.object() must pass a single LayoutNode[], not a per-template map.`
            );
        }
        this._templateLayouts = layout;
        this._ownLayout = null;
        // Apply nested object layouts to currently-active templated children
        // (templated single with active template + templated list items).
        if (this._activeTemplateId && layout[this._activeTemplateId]) {
            this._applyNestedObjectLayouts(layout[this._activeTemplateId], this._children);
        }
        for (const item of this._items) {
            if (item.templateId && layout[item.templateId]) {
                this._applyNestedObjectLayouts(layout[item.templateId], item.children);
            }
        }
    }

    /**
     * Walk an inner layout for nested `object` nodes and forward each one to
     * the matching child field. The recursion bottoms out naturally: each
     * matched child is itself an ObjectField and will run `_applyNestedObjectLayouts`
     * against its own children whenever they materialise.
     */
    private _applyNestedObjectLayouts(layout: LayoutNode[], children: Map<string, IField>): void {
        for (const node of layout) {
            if (node.type === "object") {
                const child = children.get(node.fieldName);
                if (child && isObjectField(child)) {
                    child.setInnerLayout(node.inner);
                }
            } else if (node.type === "tabs") {
                for (const tab of node.tabs) {
                    this._applyNestedObjectLayouts(tab.layout, children);
                }
            }
        }
    }

    /**
     * Returns the inner layout that should apply to a freshly-built children
     * Map for the given templateId (templated objects/lists) or for the
     * non-templated case. Used to seed nested object layouts on newly-created
     * children before they go live.
     */
    private _innerLayoutFor(templateId: string | undefined): LayoutNode[] | undefined {
        if (this.isTemplated) {
            if (templateId === undefined) {
                return undefined;
            }
            return this._templateLayouts[templateId];
        }
        return this._ownLayout ?? undefined;
    }

    private _resolveLayoutForChildren(
        children: Map<string, IField>,
        templateId: string | null
    ): LayoutNodeVM[] {
        const formImpl = this._form as FormModel | null;
        const layoutNodes = this.isTemplated
            ? templateId !== null
                ? this._templateLayouts[templateId]
                : undefined
            : (this._ownLayout ?? undefined);
        if (layoutNodes && formImpl?.resolveChildLayout) {
            return formImpl.resolveChildLayout(layoutNodes, children);
        }
        // Default: one row per visible child, in insertion order.
        const fallback: LayoutNodeVM[] = [];
        for (const [, field] of children) {
            if (field.visible) {
                fallback.push({ type: "row", fields: [field.vm] });
            }
        }
        return fallback;
    }

    get children(): Map<string, IField> {
        return this._children;
    }

    get items(): IListItemField[] {
        return this._items.map(item => ({
            key: item.key,
            children: item.children,
            templateId: item.templateId,
            getData: () => this._getItemData(item)
        }));
    }

    private _getItemData(item: ListItem): Record<string, unknown> {
        const data = getChildrenData(item.children);
        if (item.templateId !== undefined) {
            return { [TEMPLATE_DISCRIMINATOR]: item.templateId, ...data };
        }
        return data;
    }

    getChild(name: string): IField | undefined {
        return this._children.get(name);
    }

    fields(
        factory: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder | undefined>
    ): void {
        if (this.isTemplated) {
            throw new Error(
                `Object field "${this.config.name}" is templated; use templates.add()/remove() to manage children. Each template owns its own fields.`
            );
        }
        const builders = factory((this._form as FormModel).registry);

        for (const [name, builder] of Object.entries(builders)) {
            if (builder === undefined) {
                this._children.delete(name);
                this.config.childBuilders[name] = undefined as unknown as IFieldBuilder;
                delete this.config.childBuilders[name];
                if (this.config.isList) {
                    for (const item of this._items) {
                        item.children.delete(name);
                    }
                }
                continue;
            }

            this.config.childBuilders[name] = builder;
            const built = builder.build(name);
            const newField = createFieldFromConfig(built, this._form, this.qualifiedName);
            this._children.set(name, newField);

            if (this.config.isList) {
                for (const item of this._items) {
                    const itemField = createFieldFromConfig(built, this._form, this.qualifiedName);
                    item.children.set(name, itemField);
                }
            }
        }

        // Re-apply nested object layouts so newly-added children pick up any
        // layout.object() entries already registered on this field.
        if (this._ownLayout) {
            this._applyNestedObjectLayouts(this._ownLayout, this._children);
            for (const item of this._items) {
                this._applyNestedObjectLayouts(this._ownLayout, item.children);
            }
        }
    }

    getListItemChild(index: number, name: string): IField | undefined {
        const item = this._items[index];
        return item?.children.get(name);
    }

    getData(): any {
        if (this.config.isList) {
            return this._items.map(item => this._getItemData(item));
        }
        if (this.isTemplated) {
            if (this._activeTemplateId === null) {
                return null;
            }
            return {
                [TEMPLATE_DISCRIMINATOR]: this._activeTemplateId,
                ...getChildrenData(this._children)
            };
        }
        return getChildrenData(this._children);
    }

    getValue<T = unknown>(): T {
        return this.getData() as T;
    }

    setValue(value: unknown): void {
        this.setValueSilent(value);
    }

    setValueSilent(value: unknown): void {
        if (this.config.isList) {
            this._items = [];
            if (Array.isArray(value)) {
                for (const itemData of value) {
                    if (this.isTemplated) {
                        if (!itemData || typeof itemData !== "object") {
                            continue;
                        }
                        const data = itemData as Record<string, unknown>;
                        const templateId = data[TEMPLATE_DISCRIMINATOR];
                        if (typeof templateId !== "string") {
                            continue;
                        }
                        if (!this._findTemplate(templateId)) {
                            continue;
                        }
                        const { [TEMPLATE_DISCRIMINATOR]: _discarded, ...rest } = data;
                        this._addItemInternal(rest, templateId);
                    } else {
                        this._addItemInternal(itemData);
                    }
                }
            }
            return;
        }
        if (this.isTemplated) {
            if (value === null || value === undefined) {
                this._activeTemplateId = null;
                this._children = new Map();
                return;
            }
            const data = value as Record<string, unknown>;
            const templateId = data[TEMPLATE_DISCRIMINATOR];
            if (typeof templateId !== "string") {
                return;
            }
            if (!this._findTemplate(templateId)) {
                return;
            }
            this._rebuildChildrenForTemplate(templateId);
            const { [TEMPLATE_DISCRIMINATOR]: _discarded, ...rest } = data;
            hydrateChildren(this._children, rest);
            return;
        }
        hydrateChildren(this._children, value as Record<string, unknown>);
    }

    addItem(
        templateIdOrData?: string | Record<string, unknown>,
        data?: Record<string, unknown>
    ): void {
        if (this.isTemplated) {
            if (typeof templateIdOrData !== "string") {
                throw new Error(
                    `Object field "${this.config.name}": templated list items require a template id. ` +
                        `Call addItem(templateId) with one of: ${this._templates.map(t => t.id).join(", ")}.`
                );
            }
            if (!this._findTemplate(templateIdOrData)) {
                throw new Error(
                    `Template "${templateIdOrData}" not found on field "${this.config.name}". ` +
                        `Available: ${this._templates.map(t => t.id).join(", ") || "(none)"}.`
                );
            }
            this._addItemInternal(data, templateIdOrData);
            return;
        }
        if (typeof templateIdOrData === "string") {
            throw new Error(
                `Object field "${this.config.name}" is not templated; addItem() does not accept a template id.`
            );
        }
        this._addItemInternal(templateIdOrData);
    }

    removeItem(index: number): void {
        this._items.splice(index, 1);
    }

    moveItem(fromIndex: number, toIndex: number): void {
        if (
            fromIndex < 0 ||
            fromIndex >= this._items.length ||
            toIndex < 0 ||
            toIndex >= this._items.length ||
            fromIndex === toIndex
        ) {
            return;
        }
        const [item] = this._items.splice(fromIndex, 1);
        this._items.splice(toIndex, 0, item);
    }

    duplicateItem(index: number): void {
        const source = this._items[index];
        if (!source) {
            return;
        }
        const data = getChildrenData(source.children);
        const children = createChildFields(
            this._templateChildBuilders(source.templateId),
            this._form,
            this.qualifiedName
        );
        hydrateChildren(children, data, { clone: true });
        const key = `item_${++itemKeyCounter}`;
        this._items.splice(index + 1, 0, { key, children, templateId: source.templateId });
        const inner = this._innerLayoutFor(source.templateId);
        if (inner) {
            this._applyNestedObjectLayouts(inner, children);
        }
    }

    private _templateChildBuilders(templateId: string | undefined): Record<string, IFieldBuilder> {
        if (templateId === undefined) {
            return this.config.childBuilders;
        }
        const template = this._findTemplate(templateId);
        if (!template) {
            throw new Error(`Template "${templateId}" not found on field "${this.config.name}".`);
        }
        return template.childBuilders;
    }

    private _addItemInternal(data?: Record<string, unknown>, templateId?: string): void {
        const children = createChildFields(
            this._templateChildBuilders(templateId),
            this._form,
            this.qualifiedName
        );
        if (data) {
            hydrateChildren(children, data);
        }
        const key = `item_${++itemKeyCounter}`;
        this._items.push({ key, children, templateId });
        const inner = this._innerLayoutFor(templateId);
        if (inner) {
            this._applyNestedObjectLayouts(inner, children);
        }
    }

    resetValidation(): void {
        this._base.resetValidation();
        for (const [, field] of this._children) {
            field.resetValidation();
        }
        for (const item of this._items) {
            for (const [, field] of item.children) {
                field.resetValidation();
            }
        }
    }

    as<T extends keyof FieldTypeMap>(type: T): FieldTypeMap[T] {
        if (type !== "object") {
            throw new Error(`Field "${this.config.name}" is type "object", not "${type}".`);
        }
        return this as unknown as FieldTypeMap[T];
    }

    get vm(): IObjectFieldVM {
        const baseVm = this._base.vm;
        return {
            name: baseVm.name,
            type: "object",
            label: baseVm.label,
            help: baseVm.help,
            description: baseVm.description,
            note: baseVm.note,
            placeholder: baseVm.placeholder,
            value: this.getValue(),
            validation: baseVm.validation,
            validating: this._validating,
            required: baseVm.required,
            visible: baseVm.visible,
            disabled: baseVm.disabled,
            renderer: baseVm.renderer,
            rendererSettings: baseVm.rendererSettings,
            onChange: (value: unknown) => this.setValue(value),
            onBlur: () => {
                if (this._form?.submitted) {
                    void this.validate();
                }
                this.blur();
            },
            focusRequested: baseVm.focusRequested,
            clearFocusRequest: baseVm.clearFocusRequest,
            isList: this.config.isList,
            fields: this.config.isList
                ? []
                : Array.from(this._children.values())
                      .filter(f => f.visible)
                      .map(f => f.vm),
            layout: this.config.isList
                ? []
                : this._resolveLayoutForChildren(this._children, this._activeTemplateId),
            items: this.config.isList
                ? this._items.map((item, index) => ({
                      key: item.key,
                      fields: Array.from(item.children.values())
                          .filter(f => f.visible)
                          .map(f => f.vm),
                      layout: this._resolveLayoutForChildren(
                          item.children,
                          item.templateId ?? null
                      ),
                      templateId: item.templateId,
                      remove: () => this.removeItem(index),
                      moveUp: () => this.moveItem(index, index - 1),
                      moveDown: () => this.moveItem(index, index + 1),
                      duplicate: () => this.duplicateItem(index)
                  }))
                : [],
            addItem: (value?: unknown) => {
                return value !== undefined ? this.addItem(value as string) : this.addItem();
            },
            removeItem: (index: number) => this.removeItem(index),
            moveItem: (from: number, to: number) => this.moveItem(from, to),
            duplicateItem: (index: number) => this.duplicateItem(index),
            isTemplated: this.isTemplated,
            availableTemplates: this.availableTemplates,
            activeTemplateId: this._activeTemplateId,
            setTemplate: (templateId: string) => this.setTemplate(templateId)
        };
    }

    get hasErrors(): boolean {
        const checkChildren = (children: Map<string, IField>): boolean => {
            for (const [, field] of children) {
                if (field.vm.validation.isValid === false) {
                    return true;
                }
                if (isObjectField(field) && field.hasErrors) {
                    return true;
                }
            }
            return false;
        };

        if (this.config.isList) {
            for (const item of this._items) {
                if (checkChildren(item.children)) {
                    return true;
                }
            }
        } else {
            if (checkChildren(this._children)) {
                return true;
            }
        }
        return false;
    }

    async validate(options?: { force?: boolean }): Promise<boolean> {
        if (!this.visible) {
            this.setValidation({ isValid: null });
            return true;
        }

        runInAction(() => {
            this._validating = true;
        });

        try {
            const requiredState = this._base.resolveRequired();
            if (requiredState.required) {
                const message = requiredState.message || "This field is required.";
                if (this.config.isList && this._items.length === 0) {
                    this.setValidation({ isValid: false, message });
                    return false;
                }
                if (!this.config.isList) {
                    if (this.isTemplated) {
                        if (this._activeTemplateId === null) {
                            this.setValidation({ isValid: false, message });
                            return false;
                        }
                    } else {
                        const data = this.getData();
                        const hasAnyValue = Object.values(data).some(
                            v => v !== null && v !== undefined && v !== ""
                        );
                        if (!hasAnyValue) {
                            this.setValidation({ isValid: false, message });
                            return false;
                        }
                    }
                }
            }

            if (this.config.isList && this.config.listSchema) {
                const listData = this.getData();
                const result = await this.config.listSchema.safeParseAsync(listData);
                if (!result.success) {
                    const firstIssue = result.error.issues[0];
                    runInAction(() => {
                        this.setValidation({
                            isValid: false,
                            message: firstIssue?.message || "Invalid value."
                        });
                    });
                    return false;
                }
            }

            if (this.config.schema) {
                const data = this.getData();
                const result = await this.config.schema.safeParseAsync(data);
                if (!result.success) {
                    const firstIssue = result.error.issues[0];
                    runInAction(() => {
                        this.setValidation({
                            isValid: false,
                            message: firstIssue?.message || "Invalid value."
                        });
                    });
                    return false;
                }
            }

            let allValid = true;

            if (this.config.isList) {
                for (const item of this._items) {
                    const valid = await validateChildren(item.children, options);
                    if (!valid) {
                        allValid = false;
                    }
                }
            } else {
                allValid = await validateChildren(this._children, options);
            }

            runInAction(() => {
                this.setValidation({ isValid: allValid });
            });

            return allValid;
        } finally {
            runInAction(() => {
                this._validating = false;
            });
        }
    }
}
