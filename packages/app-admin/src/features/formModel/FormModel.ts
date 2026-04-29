import { makeAutoObservable, computed, toJS, runInAction, observable } from "mobx";
import { Field } from "./Field.js";
import { ObjectField, isObjectField } from "./ObjectField.js";
import type {
    IFormModel,
    IField,
    IFieldBuilder,
    IFieldBuilderRegistry,
    IObjectFieldConfig,
    IObjectField,
    IFormVM,
    IFormError,
    IFormModelConfig,
    ILayoutBuilder,
    ILayoutNodeHandle,
    ILayoutModifier,
    IPositionedLayoutNode,
    ILayoutNodeAccessHandle,
    ITabsHandle,
    ITabHandle,
    IRule,
    IRuleEvaluator,
    LayoutNode,
    LayoutPosition,
    LayoutNodeVM,
    IRowNode,
    IRowNodeHandle,
    IRowNodeVM,
    ISeparatorNode,
    ISeparatorNodeVM,
    ITabsNode,
    ITabsNodeVM,
    ITabDefinition,
    ITabDefinitionInput,
    ITabDefinitionVM,
    IElementNode,
    IElementNodeVM,
    IObjectNode,
    FormRule,
    FormRuleFn
} from "./abstractions.js";

const layoutAPI: ILayoutBuilder = {
    row(...fieldIds: string[]): IRowNodeHandle {
        const node: IRowNode = { type: "row", fieldIds };
        const handle: IRowNodeHandle = Object.assign(node, {
            before(target: string) {
                node.position = { type: "before", target };
                return handle;
            },
            after(target: string) {
                node.position = { type: "after", target };
                return handle;
            }
        });
        return handle;
    },
    separator(): ISeparatorNode {
        return { type: "separator" };
    },
    tabs(config: {
        id?: string;
        renderer?: string;
        tabs: ITabDefinitionInput[];
        rules?: IRule[];
    }): ITabsNode {
        return {
            type: "tabs",
            id: config.id,
            renderer: config.renderer,
            tabs: config.tabs.map(resolveTabDefinition),
            rules: config.rules
        };
    },
    element(renderer: string, props?: Record<string, unknown>): IElementNode {
        return { type: "element", renderer, props };
    },
    object(
        fieldName: string,
        inner:
            | ((layout: ILayoutBuilder) => LayoutNode[])
            | Record<string, (layout: ILayoutBuilder) => LayoutNode[]>
    ): IObjectNode {
        return { type: "object", fieldName, inner: resolveObjectInner(inner) };
    }
};

function resolveObjectInner(
    inner:
        | ((layout: ILayoutBuilder) => LayoutNode[])
        | Record<string, (layout: ILayoutBuilder) => LayoutNode[]>
): LayoutNode[] | Record<string, LayoutNode[]> {
    if (typeof inner === "function") {
        return inner(layoutAPI);
    }
    const resolved: Record<string, LayoutNode[]> = {};
    for (const [tplId, factory] of Object.entries(inner)) {
        resolved[tplId] = factory(layoutAPI);
    }
    return resolved;
}

function resolveTabDefinition(input: ITabDefinitionInput): ITabDefinition {
    return {
        id: input.id,
        label: input.label,
        description: input.description,
        icon: input.icon,
        rules: input.rules,
        layout: input.layout(layoutAPI)
    };
}

function collectBuilders(
    fields: Map<string, IField>,
    builders: Map<string, IFieldBuilder> | Record<string, IFieldBuilder>,
    predicate: (builder: IFieldBuilder) => boolean,
    result: IFieldBuilder[]
): void {
    const entries = builders instanceof Map ? builders.entries() : Object.entries(builders);
    for (const [name, builder] of entries) {
        if (predicate(builder)) {
            result.push(builder);
        }
        const field = fields instanceof Map ? fields.get(name) : undefined;
        if (field && isObjectField(field)) {
            collectBuilders(field.children, field.config.childBuilders, predicate, result);
            const templates = (field.config as IObjectFieldConfig).templates;
            if (templates) {
                for (const tpl of templates) {
                    collectBuildersFlat(tpl.childBuilders, predicate, result);
                }
            }
        }
    }
}

function collectBuildersFlat(
    builders: Record<string, IFieldBuilder>,
    predicate: (builder: IFieldBuilder) => boolean,
    result: IFieldBuilder[]
): void {
    for (const builder of Object.values(builders)) {
        if (predicate(builder)) {
            result.push(builder);
        }
    }
}

export class FormModel implements IFormModel {
    private _fields = new Map<string, IField>();
    private _builders = new Map<string, IFieldBuilder>();
    private _layout: LayoutNode[] = [];
    private _baseline = new Map<string, unknown>();
    private _submitted = false;
    private _validateOnChange = false;
    private _isValid: boolean | null = null;
    private _formRuleErrors: IFormError[] = [];
    private _activeTabs = observable.map<string, string>();
    private _ruleEvaluators: IRuleEvaluator[] = [];
    private _warnedRuleTypes = new Set<string>();
    private _formRules: FormRule[] = [];
    private _lastFocusedField: IField | null = null;
    private _registry: IFieldBuilderRegistry;

    constructor(config: IFormModelConfig, registry: IFieldBuilderRegistry) {
        this._registry = registry;
        this._ruleEvaluators = config.ruleEvaluators ?? [];

        const builders = config.fields(registry);

        // Build fields from builders
        for (const [name, builder] of Object.entries(builders)) {
            this._builders.set(name, builder);
            const fieldConfig = builder.build(name);
            const field = this._createField(fieldConfig);
            field.setForm(this);
            this._fields.set(name, field);
        }

        // Build layout
        if (config.layout) {
            this._layout = config.layout(layoutAPI);
            this._warnOrphanFields();
        } else {
            this._layout = this._generateDefaultLayout();
        }

        // Register per-template layouts on object fields referenced via layout.object()
        this._registerObjectNodeLayouts(this._layout);

        // Propagate ancestor rules from layout into fields
        this._propagateAncestorRules();

        // Validation strategy
        this._validateOnChange = config.validateOnSubmit === false;

        // Snapshot baseline from defaults
        this._snapshotBaseline();

        makeAutoObservable(
            this,
            {
                vm: computed
            },
            { autoBind: true }
        );
    }

    evaluateRules(rules: IRule[] | undefined): { visible: boolean; disabled: boolean } {
        let visible = true;
        let disabled = false;
        if (!rules || rules.length === 0) {
            return { visible, disabled };
        }

        for (const rule of rules) {
            const evaluator = this._ruleEvaluators.find(e => e.canEvaluate(rule));
            if (!evaluator) {
                if (
                    process.env.NODE_ENV === "development" &&
                    !this._warnedRuleTypes.has(rule.type)
                ) {
                    this._warnedRuleTypes.add(rule.type);
                    console.warn(
                        `[FormModel] No evaluator registered for rule type "${rule.type}". Rule is ignored.`
                    );
                }
                continue;
            }
            const matched = evaluator.evaluate(rule, this);
            if (!matched) {
                continue;
            }
            if (rule.action === "hide") {
                visible = false;
            } else if (rule.action === "disable") {
                disabled = true;
            }
        }

        return { visible, disabled };
    }

    field(name: string): IField {
        // Try exact match first (supports dotted field names like "properties.language").
        const field = this._fields.get(name);
        if (field) {
            return field;
        }

        // Try dot-notation traversal through ObjectField children.
        const parts = name.split(".");
        if (parts.length > 1) {
            let current: IField | undefined = this._fields.get(parts[0]);
            for (let i = 1; i < parts.length && current; i++) {
                if (isObjectField(current)) {
                    current = current.getChild(parts[i]);
                } else {
                    current = undefined;
                }
            }
            if (current) {
                return current;
            }
        }

        throw new Error(`Field "${name}" not found.`);
    }

    focusField(name: string): void {
        if (this._lastFocusedField) {
            this._lastFocusedField.clearFocusRequest();
            this._lastFocusedField = null;
        }

        const activations = this._buildFocusPath(name);
        let field: IField | undefined;
        try {
            field = this.field(name);
        } catch {
            // Field not found — no-op.
        }

        runInAction(() => {
            if (activations) {
                for (const act of activations) {
                    this._activeTabs.set(act.tabKey, act.tabId);
                }
            }
            if (field) {
                field.requestFocus();
                this._lastFocusedField = field;
            }
        });
    }

    fields(
        factory: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder | undefined>
    ): void {
        const builders = factory(this._registry);

        for (const [name, builder] of Object.entries(builders)) {
            if (builder === undefined) {
                // undefined = remove
                this._builders.delete(name);
                this.removeField(name);
                continue;
            }

            this._builders.set(name, builder);
            const fieldConfig = builder.build(name);
            const field = this._createField(fieldConfig);
            field.setForm(this);

            // Replace or add — same operation on the map
            this._fields.set(name, field);
        }

        // Re-snapshot baseline to include new fields
        this._snapshotBaseline();
        this._propagateAncestorRules();
    }

    layout(factory: (layout: ILayoutModifier) => (LayoutNode | IPositionedLayoutNode)[]): void;
    layout(nodeId: string): ILayoutNodeAccessHandle;
    layout(
        factoryOrNodeId:
            | ((layout: ILayoutModifier) => (LayoutNode | IPositionedLayoutNode)[])
            | string
    ): void | ILayoutNodeAccessHandle {
        if (typeof factoryOrNodeId === "string") {
            return this._accessLayoutNode(factoryOrNodeId);
        }

        const factory = factoryOrNodeId;
        const removals: string[] = [];
        const modifierLayoutAPI = this._createModifierLayoutAPI(removals);

        const entries = factory(modifierLayoutAPI);

        // Process removals first
        for (const target of removals) {
            this._layout = this._removeFromLayout(this._layout, target);
        }

        // Process additions with positional modifiers
        for (const entry of entries) {
            if (this._isPositionedNode(entry)) {
                const { node, position } = entry;
                if (position) {
                    this._layout = this._insertIntoLayout(this._layout, node, position);
                } else {
                    this._layout.push(node);
                }
            } else {
                this._layout.push(entry);
            }
        }

        this._registerObjectNodeLayouts(this._layout);
        this._propagateAncestorRules();
    }

    removeField(name: string): void {
        this._fields.delete(name);
        this._baseline.delete(name);

        // Remove from layout
        this._layout = this._removeFromLayout(this._layout, name);
    }

    getData(): Record<string, unknown> {
        const data: Record<string, unknown> = {};
        for (const [name, field] of this._fields) {
            if (isObjectField(field)) {
                data[name] = toJS(field.getData());
            } else {
                data[name] = toJS(field.getValue());
            }
        }
        return data;
    }

    setData(data: Record<string, unknown>): void {
        for (const [name, value] of Object.entries(data)) {
            const field = this._fields.get(name);
            if (field) {
                field.setValueSilent(value);
            }
        }
        this._snapshotBaseline();
        this._resetAllValidation();
        this._submitted = false;
        this._isValid = null;
        this._formRuleErrors = [];
    }

    reset(): void {
        for (const [name, field] of this._fields) {
            const baselineValue = this._baseline.get(name);
            field.setValueSilent(baselineValue ?? field.config.defaultValue ?? null);
        }
        this._resetAllValidation();
        this._submitted = false;
        this._isValid = null;
        this._formRuleErrors = [];
    }

    get isDirty(): boolean {
        for (const [name, field] of this._fields) {
            const baseline = this._baseline.get(name);
            const current = isObjectField(field) ? field.getData() : field.getValue();
            if (JSON.stringify(toJS(current)) !== JSON.stringify(toJS(baseline))) {
                return true;
            }
        }
        return false;
    }

    get isValid(): boolean | null {
        return this._isValid;
    }

    get submitted(): boolean {
        return this._submitted;
    }

    get errors(): IFormError[] {
        if (!this._submitted) {
            return [];
        }
        const errors: IFormError[] = [];
        for (const [, field] of this._fields) {
            if (field.vm.validation.isValid === false) {
                errors.push({
                    path: field.name,
                    label: field.config.label,
                    message: field.vm.validation.message || "Invalid value."
                });
            }
        }
        return [...errors, ...this._formRuleErrors];
    }

    addRule(rule: FormRule): void {
        this._formRules.push(rule);
    }

    setLayout(factory: (layout: ILayoutBuilder) => LayoutNode[]): void {
        this._layout = factory(layoutAPI);
        this._warnOrphanFields();
        this._registerObjectNodeLayouts(this._layout);
        this._propagateAncestorRules();
    }

    async validate(): Promise<boolean> {
        let allFieldsValid = true;

        for (const [, field] of this._fields) {
            const valid = await field.validate({ force: true });
            if (!valid) {
                allFieldsValid = false;
            }
        }

        // Form-level rules — run after per-field validation. Errors surface
        // on per-field validation when the path matches.
        const ruleErrors: IFormError[] = [];
        for (const rule of this._formRules) {
            const errors = await this._runFormRule(rule);
            for (const err of errors) {
                ruleErrors.push(err);
                if (err.path) {
                    const target = this._tryGetField(err.path);
                    if (target) {
                        target.setValidation({ isValid: false, message: err.message });
                    }
                }
            }
        }

        const isValid = allFieldsValid && ruleErrors.length === 0;
        runInAction(() => {
            this._formRuleErrors = ruleErrors;
            this._isValid = isValid;
            this._submitted = true;
        });
        return isValid;
    }

    private async _runFormRule(rule: FormRule): Promise<IFormError[]> {
        if (typeof rule === "function") {
            const fn = rule as FormRuleFn;
            const result = await fn(this);
            return Array.isArray(result) ? result : [];
        }
        const data = this.getData();
        const result = await rule.safeParseAsync(data);
        if (result.success) {
            return [];
        }
        return result.error.issues.map(issue => {
            const path = issue.path.map(String).join(".");
            const field = path ? this._tryGetField(path) : undefined;
            return {
                path,
                label: field?.config.label,
                message: issue.message || "Invalid value."
            };
        });
    }

    private _tryGetField(path: string): IField | undefined {
        try {
            return this.field(path);
        } catch {
            return undefined;
        }
    }

    async submit<T = Record<string, unknown>>(): Promise<T | false> {
        const valid = await this.validate();
        if (!valid) {
            return false;
        }
        return this.getData() as T;
    }

    get vm(): IFormVM {
        return {
            layout: this._resolveLayout(),
            errors: this.errors,
            isDirty: this.isDirty,
            isValid: this._isValid
        };
    }

    getField(name: string): IField | undefined {
        return this._fields.get(name);
    }

    getFields(): Map<string, IField> {
        return this._fields;
    }

    getFieldBuilders(predicate?: (builder: IFieldBuilder) => boolean): IFieldBuilder[] {
        const pred = predicate ?? (() => true);
        const result: IFieldBuilder[] = [];
        collectBuilders(this._fields, this._builders, pred, result);
        return result;
    }

    private _resolveLayout(): LayoutNodeVM[] {
        return this._layout
            .map(node => this._resolveLayoutNode(node))
            .filter(Boolean) as LayoutNodeVM[];
    }

    private _resolveLayoutNode(node: LayoutNode): LayoutNodeVM | null {
        switch (node.type) {
            case "row":
                return this._resolveRowNode(node);
            case "separator":
                return this._resolveSeparatorNode();
            case "tabs":
                return this._resolveTabsNode(node);
            case "element":
                return this._resolveElementNode(node);
            case "object":
                return this._resolveObjectNode(node);
            default:
                return null;
        }
    }

    /**
     * Object node resolves to a single-field row referencing the field. The
     * per-template layouts have already been registered on the field at build
     * time; the field's VM exposes `layout` (or `items[].layout`) so renderers
     * can walk it.
     */
    private _resolveObjectNode(node: IObjectNode): IRowNodeVM | null {
        const field = this._fields.get(node.fieldName);
        if (!field || !field.visible) {
            return null;
        }
        return { type: "row", fields: [field.vm] };
    }

    /**
     * Resolve a layout-node sub-tree against an arbitrary children Map. Used
     * by ObjectField to compute its own VM-level `layout` (active template /
     * per-item template). Field-id lookups go to the children scope; tabs and
     * other recursive cases are resolved with the same scope.
     */
    get registry(): IFieldBuilderRegistry {
        return this._registry;
    }

    public resolveChildLayout(layout: LayoutNode[], children: Map<string, IField>): LayoutNodeVM[] {
        return layout
            .map(node => this._resolveChildLayoutNode(node, children))
            .filter(Boolean) as LayoutNodeVM[];
    }

    private _resolveChildLayoutNode(
        node: LayoutNode,
        children: Map<string, IField>
    ): LayoutNodeVM | null {
        switch (node.type) {
            case "row": {
                const fields = node.fieldIds
                    .map(id => children.get(id))
                    .filter((f): f is IField => f !== undefined && f.visible)
                    .map(f => f.vm);
                if (fields.length === 0) {
                    return null;
                }
                return { type: "row", fields };
            }
            case "separator":
                return { type: "separator" };
            case "element":
                return this._resolveElementNode(node);
            case "object": {
                const field = children.get(node.fieldName);
                if (!field || !field.visible) {
                    return null;
                }
                return { type: "row", fields: [field.vm] };
            }
            case "tabs":
                return this._resolveChildTabsNode(node, children);
            default:
                return null;
        }
    }

    private _resolveChildTabsNode(
        node: ITabsNode,
        children: Map<string, IField>
    ): ITabsNodeVM | null {
        if (node.tabs.length === 0) {
            return null;
        }
        const containerState = this.evaluateRules(node.rules);
        if (!containerState.visible) {
            return null;
        }
        const tabKey = node.id || this._tabsNodeKey(node);
        const tabs: ITabDefinitionVM[] = [];
        for (const tab of node.tabs) {
            const tabState = this.evaluateRules(tab.rules);
            if (!tabState.visible) {
                continue;
            }
            tabs.push({
                id: tab.id,
                label: tab.label,
                description: tab.description,
                icon: tab.icon,
                hasErrors: this._childTabHasErrors(tab.layout, children),
                disabled: containerState.disabled || tabState.disabled,
                layout: tab.layout
                    .map(child => this._resolveChildLayoutNode(child, children))
                    .filter(Boolean) as LayoutNodeVM[]
            });
        }
        if (tabs.length === 0) {
            return null;
        }
        const storedActive = this._activeTabs.get(tabKey);
        const validActive = tabs.find(t => t.id === storedActive) ? storedActive! : tabs[0].id;
        return {
            type: "tabs",
            id: node.id,
            renderer: node.renderer,
            tabs,
            disabled: containerState.disabled,
            activeTabId: validActive,
            setActiveTab: (id: string) => {
                runInAction(() => {
                    this._activeTabs.set(tabKey, id);
                });
            }
        };
    }

    private _childTabHasErrors(layout: LayoutNode[], children: Map<string, IField>): boolean {
        for (const node of layout) {
            if (node.type === "row") {
                for (const id of node.fieldIds) {
                    const field = children.get(id);
                    if (!field) {
                        continue;
                    }
                    if (field.vm.validation.isValid === false) {
                        return true;
                    }
                    if (isObjectField(field) && field.hasErrors) {
                        return true;
                    }
                }
            } else if (node.type === "object") {
                const field = children.get(node.fieldName);
                if (field && isObjectField(field) && field.hasErrors) {
                    return true;
                }
            } else if (node.type === "tabs") {
                for (const tab of node.tabs) {
                    if (this._childTabHasErrors(tab.layout, children)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private _resolveRowNode(node: IRowNode): IRowNodeVM | null {
        const fields = node.fieldIds
            .map(id => this._fields.get(id))
            .filter((f): f is IField => f !== undefined && f.visible)
            .map(f => f.vm);

        if (fields.length === 0) {
            return null;
        }

        return { type: "row", fields };
    }

    private _resolveSeparatorNode(): ISeparatorNodeVM {
        return { type: "separator" };
    }

    private _resolveTabsNode(node: ITabsNode): ITabsNodeVM | null {
        if (node.tabs.length === 0) {
            return null;
        }

        // Evaluate rules on the tabs container itself
        const containerState = this.evaluateRules(node.rules);
        if (!containerState.visible) {
            return null;
        }

        const tabKey = node.id || this._tabsNodeKey(node);

        const tabs: ITabDefinitionVM[] = [];
        for (const tab of node.tabs) {
            const tabState = this.evaluateRules(tab.rules);
            if (!tabState.visible) {
                continue;
            }
            tabs.push({
                id: tab.id,
                label: tab.label,
                description: tab.description,
                icon: tab.icon,
                hasErrors: this._tabHasErrors(tab.layout),
                disabled: containerState.disabled || tabState.disabled,
                layout: tab.layout
                    .map(child => this._resolveLayoutNode(child))
                    .filter(Boolean) as LayoutNodeVM[]
            });
        }

        if (tabs.length === 0) {
            return null;
        }

        // Resolve active tab — fall back to first visible tab if stored value is invalid
        const storedActive = this._activeTabs.get(tabKey);
        const validActive = tabs.find(t => t.id === storedActive) ? storedActive! : tabs[0].id;

        return {
            type: "tabs",
            id: node.id,
            renderer: node.renderer,
            tabs,
            disabled: containerState.disabled,
            activeTabId: validActive,
            setActiveTab: (id: string) => {
                runInAction(() => {
                    this._activeTabs.set(tabKey, id);
                });
            }
        };
    }

    private _resolveElementNode(node: IElementNode): IElementNodeVM {
        return {
            type: "element",
            renderer: node.renderer,
            props: node.props
        };
    }

    private _tabHasErrors(layout: LayoutNode[]): boolean {
        const fieldIds = this._collectFieldIdsFromLayout(layout);
        for (const id of fieldIds) {
            const field = this._fields.get(id);
            if (!field) {
                continue;
            }
            if (field.vm.validation.isValid === false) {
                return true;
            }
            if (isObjectField(field) && field.hasErrors) {
                return true;
            }
        }
        return false;
    }

    private _collectFieldIdsFromLayout(layout: LayoutNode[]): string[] {
        const ids: string[] = [];
        for (const node of layout) {
            if (node.type === "row") {
                ids.push(...node.fieldIds);
            } else if (node.type === "tabs") {
                for (const tab of node.tabs) {
                    ids.push(...this._collectFieldIdsFromLayout(tab.layout));
                }
            } else if (node.type === "object") {
                ids.push(node.fieldName);
            }
        }
        return ids;
    }

    /**
     * Walk the form layout for `object` nodes and forward each inner layout
     * to the referenced field. Recursion into nested `object` nodes is handled
     * by `ObjectField.setInnerLayout` itself (Phase 8c.1) — when the inner
     * layout references nested object children, those children re-apply the
     * registration whenever they materialise (template activation, list-item
     * creation, modifier `fields()` additions).
     */
    private _registerObjectNodeLayouts(layout: LayoutNode[]): void {
        for (const node of layout) {
            if (node.type === "object") {
                const field = this._fields.get(node.fieldName);
                if (field && isObjectField(field)) {
                    field.setInnerLayout(node.inner);
                }
            } else if (node.type === "tabs") {
                for (const tab of node.tabs) {
                    this._registerObjectNodeLayouts(tab.layout);
                }
            }
        }
    }

    private _tabsNodeKey(node: ITabsNode): string {
        return `__tabs_${node.tabs.map(t => t.id).join("_")}`;
    }

    // --- Focus path walking ---

    private _buildFocusPath(name: string): { tabKey: string; tabId: string }[] | null {
        const segments = name.split(".");
        return this._walkLayoutForFocus(this._layout, segments, this._fields);
    }

    private _walkLayoutForFocus(
        layout: LayoutNode[],
        segments: string[],
        fieldScope: Map<string, IField>
    ): { tabKey: string; tabId: string }[] | null {
        const target = segments[0];

        for (const node of layout) {
            switch (node.type) {
                case "row": {
                    if (!node.fieldIds.includes(target)) {
                        break;
                    }
                    return this._focusDiveIntoField(target, segments, fieldScope);
                }
                case "object": {
                    if (node.fieldName !== target) {
                        break;
                    }
                    return this._focusDiveIntoObjectNode(node, segments, fieldScope);
                }
                case "tabs": {
                    const tabKey = node.id || this._tabsNodeKey(node);
                    for (const tab of node.tabs) {
                        const result = this._walkLayoutForFocus(tab.layout, segments, fieldScope);
                        if (result !== null) {
                            return [{ tabKey, tabId: tab.id }, ...result];
                        }
                    }
                    break;
                }
            }
        }
        return null;
    }

    private _focusDiveIntoField(
        fieldName: string,
        segments: string[],
        fieldScope: Map<string, IField>
    ): { tabKey: string; tabId: string }[] | null {
        if (segments.length === 1) {
            return [];
        }
        const field = fieldScope.get(fieldName);
        if (!field || !isObjectField(field)) {
            return [];
        }
        const childScope = this._resolveChildScopeForFocus(field, segments);
        if (!childScope) {
            return [];
        }
        const inner = field.getInnerLayout();
        if (!inner) {
            return [];
        }
        return this._walkLayoutForFocus(inner, childScope.segments, childScope.children);
    }

    private _focusDiveIntoObjectNode(
        node: IObjectNode,
        segments: string[],
        fieldScope: Map<string, IField>
    ): { tabKey: string; tabId: string }[] | null {
        if (segments.length === 1) {
            return [];
        }
        const field = fieldScope.get(node.fieldName);
        if (!field || !isObjectField(field)) {
            return [];
        }
        const childScope = this._resolveChildScopeForFocus(field, segments);
        if (!childScope) {
            return [];
        }
        const inner = Array.isArray(node.inner)
            ? node.inner
            : field.activeTemplateId
              ? (node.inner[field.activeTemplateId] ?? null)
              : null;
        if (!inner) {
            const stored = field.getInnerLayout();
            if (!stored) {
                return [];
            }
            return this._walkLayoutForFocus(stored, childScope.segments, childScope.children);
        }
        return this._walkLayoutForFocus(inner, childScope.segments, childScope.children);
    }

    private _resolveChildScopeForFocus(
        field: IObjectField,
        segments: string[]
    ): { segments: string[]; children: Map<string, IField> } | null {
        const nextSegment = segments[1];
        if (field.isList) {
            const index = parseInt(nextSegment, 10);
            if (!isNaN(index)) {
                const item = field.items[index];
                if (!item) {
                    return null;
                }
                return { segments: segments.slice(2), children: item.children };
            }
        }
        return { segments: segments.slice(1), children: field.children };
    }

    /**
     * Walk the layout tree and propagate ancestor rules (from tabs containers / tabs)
     * down to each field referenced inside. Fields combine these with their own rules
     * when computing visible/disabled.
     */
    private _propagateAncestorRules(): void {
        const ancestry = new Map<string, IRule[]>();
        const walk = (nodes: LayoutNode[], rules: IRule[]) => {
            for (const node of nodes) {
                if (node.type === "row") {
                    for (const id of node.fieldIds) {
                        const existing = ancestry.get(id) ?? [];
                        ancestry.set(id, [...existing, ...rules]);
                    }
                } else if (node.type === "tabs") {
                    const containerRules = [...rules, ...(node.rules ?? [])];
                    for (const tab of node.tabs) {
                        const tabRules = [...containerRules, ...(tab.rules ?? [])];
                        walk(tab.layout, tabRules);
                    }
                } else if (node.type === "object") {
                    const existing = ancestry.get(node.fieldName) ?? [];
                    ancestry.set(node.fieldName, [...existing, ...rules]);
                }
            }
        };

        walk(this._layout, []);

        for (const [, field] of this._fields) {
            field.setAncestorRules(ancestry.get(field.name) ?? []);
        }
    }

    private _generateDefaultLayout(): LayoutNode[] {
        const layout: LayoutNode[] = [];
        for (const [name, field] of this._fields) {
            if (field.visible) {
                layout.push({ type: "row", fieldIds: [name] });
            }
        }
        return layout;
    }

    private _warnOrphanFields(): void {
        const layoutFieldIds = new Set(this._collectFieldIdsFromLayout(this._layout));

        for (const [name, field] of this._fields) {
            if (field.visible && !layoutFieldIds.has(name)) {
                console.warn(
                    `[FormModel] Field "${name}" is not in the layout and not marked as .hidden(). ` +
                        `Add it to the layout or mark it as .hidden() to suppress this warning.`
                );
            }
        }
    }

    private _snapshotBaseline(): void {
        this._baseline.clear();
        for (const [name, field] of this._fields) {
            this._baseline.set(name, toJS(field.getValue()));
        }
    }

    private _resetAllValidation(): void {
        for (const [, field] of this._fields) {
            field.resetValidation();
        }
    }

    /**
     * Find the index of a layout node that matches the given target.
     * Matches: row containing fieldId, tabs by id, element by id/renderer.
     * Returns -1 if not found.
     */
    private _findLayoutIndex(layout: LayoutNode[], target: string): number {
        return layout.findIndex(node => this._nodeMatchesTarget(node, target));
    }

    private _nodeMatchesTarget(node: LayoutNode, target: string): boolean {
        switch (node.type) {
            case "row":
                return node.fieldIds.includes(target);
            case "tabs":
                return node.id === target;
            case "element":
                return node.id === target || node.renderer === target;
            case "object":
                return node.fieldName === target;
            default:
                return false;
        }
    }

    /**
     * Remove a target from the layout tree. Handles field IDs in rows,
     * and node IDs for tabs/elements. Drops rows that become empty.
     */
    private _removeFromLayout(layout: LayoutNode[], target: string): LayoutNode[] {
        return layout
            .map(node => {
                if (node.type === "row") {
                    const filtered = node.fieldIds.filter(id => id !== target);
                    if (filtered.length === 0) {
                        return null;
                    }
                    return { ...node, fieldIds: filtered };
                }
                // Remove tabs/elements/object by their ID / fieldName
                if (
                    (node.type === "tabs" && node.id === target) ||
                    (node.type === "element" && (node.id === target || node.renderer === target)) ||
                    (node.type === "object" && node.fieldName === target)
                ) {
                    return null;
                }
                return node;
            })
            .filter(Boolean) as LayoutNode[];
    }

    /**
     * Insert a layout node relative to a target field ID.
     */
    private _insertIntoLayout(
        layout: LayoutNode[],
        node: LayoutNode,
        position: LayoutPosition
    ): LayoutNode[] {
        const targetIndex = this._findLayoutIndex(layout, position.target);

        if (targetIndex === -1) {
            // Target not found — append
            return [...layout, node];
        }

        const result = [...layout];

        switch (position.type) {
            case "before":
                result.splice(targetIndex, 0, node);
                break;
            case "after":
                result.splice(targetIndex + 1, 0, node);
                break;
            case "replace":
                result.splice(targetIndex, 1, node);
                break;
        }

        return result;
    }

    private _createModifierLayoutAPI(removals: string[]): ILayoutModifier {
        return {
            row(...fieldIds: string[]): ILayoutNodeHandle {
                const node: IRowNode = { type: "row", fieldIds };
                return createLayoutNodeHandle(node);
            },
            separator(): ILayoutNodeHandle {
                const node: ISeparatorNode = { type: "separator" };
                return createLayoutNodeHandle(node);
            },
            tabs(config: {
                id?: string;
                renderer?: string;
                tabs: ITabDefinitionInput[];
                rules?: IRule[];
            }): ILayoutNodeHandle {
                const node: ITabsNode = {
                    type: "tabs",
                    id: config.id,
                    renderer: config.renderer,
                    tabs: config.tabs.map(resolveTabDefinition),
                    rules: config.rules
                };
                return createLayoutNodeHandle(node);
            },
            element(renderer: string, props?: Record<string, unknown>): ILayoutNodeHandle {
                const node: IElementNode = { type: "element", renderer, props };
                return createLayoutNodeHandle(node);
            },
            object(
                fieldName: string,
                inner:
                    | ((layout: ILayoutBuilder) => LayoutNode[])
                    | Record<string, (layout: ILayoutBuilder) => LayoutNode[]>
            ): ILayoutNodeHandle {
                const node: IObjectNode = {
                    type: "object",
                    fieldName,
                    inner: resolveObjectInner(inner)
                };
                return createLayoutNodeHandle(node);
            },
            remove(target: string): void {
                removals.push(target);
            }
        };
    }

    private _accessLayoutNode(nodeId: string): ILayoutNodeAccessHandle {
        const findTabsNode = (layout: LayoutNode[]): ITabsNode | undefined => {
            for (const node of layout) {
                if (node.type === "tabs" && node.id === nodeId) {
                    return node;
                }
                // Search inside nested tabs
                if (node.type === "tabs") {
                    for (const tab of node.tabs) {
                        const found = findTabsNode(tab.layout);
                        if (found) {
                            return found;
                        }
                    }
                }
            }
            return undefined;
        };

        return {
            as: (type: "tabs"): ITabsHandle => {
                const tabsNode = findTabsNode(this._layout);
                if (!tabsNode) {
                    throw new Error(`Layout node "${nodeId}" not found.`);
                }
                if (tabsNode.type !== type) {
                    throw new Error(
                        `Layout node "${nodeId}" is type "${tabsNode.type}", not "${type}".`
                    );
                }

                return {
                    tab: (definitionOrId: ITabDefinitionInput | string): ITabHandle => {
                        if (typeof definitionOrId === "string") {
                            // Access existing tab
                            const tab = tabsNode.tabs.find(t => t.id === definitionOrId);
                            if (!tab) {
                                throw new Error(
                                    `Tab "${definitionOrId}" not found in tabs node "${nodeId}".`
                                );
                            }
                            return {
                                layout: (factory: (layout: ILayoutBuilder) => LayoutNode[]) => {
                                    const nodes = factory(layoutAPI);
                                    tab.layout.push(...nodes);
                                },
                                before: () => {
                                    /* no-op for existing tabs */
                                },
                                after: () => {
                                    /* no-op for existing tabs */
                                }
                            };
                        } else {
                            // Add new tab — resolve the layout callback now.
                            const newTab: ITabDefinition = resolveTabDefinition(definitionOrId);
                            return {
                                layout: (factory: (layout: ILayoutBuilder) => LayoutNode[]) => {
                                    newTab.layout = factory(layoutAPI);
                                },
                                before: (targetTabId: string) => {
                                    const idx = tabsNode.tabs.findIndex(t => t.id === targetTabId);
                                    if (idx !== -1) {
                                        tabsNode.tabs.splice(idx, 0, newTab);
                                    } else {
                                        tabsNode.tabs.push(newTab);
                                    }
                                },
                                after: (targetTabId: string) => {
                                    const idx = tabsNode.tabs.findIndex(t => t.id === targetTabId);
                                    if (idx !== -1) {
                                        tabsNode.tabs.splice(idx + 1, 0, newTab);
                                    } else {
                                        tabsNode.tabs.push(newTab);
                                    }
                                }
                            };
                        }
                    }
                };
            }
        };
    }

    private _createField(config: any): IField {
        if (config.childBuilders) {
            return new ObjectField(config as IObjectFieldConfig);
        }
        return new Field(config);
    }

    private _isPositionedNode(
        entry: LayoutNode | IPositionedLayoutNode
    ): entry is IPositionedLayoutNode {
        return "node" in entry;
    }
}

function createLayoutNodeHandle(node: LayoutNode): ILayoutNodeHandle {
    const handle: ILayoutNodeHandle = {
        node,
        before(target: string): IPositionedLayoutNode {
            handle.position = { type: "before", target };
            return handle;
        },
        after(target: string): IPositionedLayoutNode {
            handle.position = { type: "after", target };
            return handle;
        },
        replace(target: string): IPositionedLayoutNode {
            handle.position = { type: "replace", target };
            return handle;
        }
    };
    return handle;
}
