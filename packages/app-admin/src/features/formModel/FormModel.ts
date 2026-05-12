import { makeAutoObservable, computed, toJS, runInAction, observable } from "mobx";
import { Field } from "./Field.js";
import { ObjectField, isObjectField } from "./ObjectField.js";
import { LayoutBuilderFactory } from "./LayoutBuilderFactory.js";
import { LayoutMutator } from "./LayoutMutator.js";
import { LayoutResolver } from "./LayoutResolver.js";
import { FocusManager } from "./FocusManager.js";
import type {
    IFormModel,
    IField,
    IFieldBuilder,
    IFieldBuilderRegistry,
    IObjectFieldConfig,
    IFormVM,
    IFormError,
    IFormModelConfig,
    ILayoutBuilder,
    ILayoutNodeBuilder,
    ILayoutModifier,
    IPositionedLayoutNode,
    ILayoutNodeAccessHandle,
    IRule,
    IRuleEvaluator,
    LayoutNode,
    LayoutNodeVM,
    FormRule,
    FormRuleFn
} from "./abstractions.js";

export class FormModel implements IFormModel {
    private _fields = new Map<string, IField>();
    private _builders = new Map<string, IFieldBuilder>();
    private _layout: LayoutNode[] = [];
    private _baseline = new Map<string, unknown>();
    private _submitted = false;
    private _submitCount = 0;
    private _validateOnChange = false;
    private _isValid: boolean | null = null;
    private _formRuleErrors: IFormError[] = [];
    private _activeTabs = observable.map<string, string>();
    private _ruleEvaluators: IRuleEvaluator[] = [];
    private _warnedRuleTypes = new Set<string>();
    private _formRules: FormRule[] = [];
    private _lastFocusedField: IField | null = null;
    private _registry: IFieldBuilderRegistry;

    private _layoutMutator = new LayoutMutator();
    private _layoutResolver: LayoutResolver = null!;
    private _focusManager: FocusManager = null!;

    constructor(config: IFormModelConfig, registry: IFieldBuilderRegistry) {
        this._registry = registry;
        this._ruleEvaluators = config.ruleEvaluators ?? [];

        const builders = config.fields(registry);

        for (const [name, builder] of Object.entries(builders)) {
            this._builders.set(name, builder);
            const fieldConfig = builder.build(name);
            const field = this._createField(fieldConfig);
            field.setForm(this);
            this._fields.set(name, field);
        }

        if (config.layout) {
            this._layout = LayoutBuilderFactory.buildNodes(
                config.layout(LayoutBuilderFactory.create())
            );
            this._warnOrphanFields();
        } else {
            this._layout = this._generateDefaultLayout();
        }

        this._registerObjectNodeLayouts(this._layout);
        this._propagateAncestorRules();

        this._validateOnChange = config.validateOnSubmit === false;
        this._snapshotBaseline();

        makeAutoObservable(
            this,
            {
                vm: computed,
                _layoutMutator: false,
                _layoutResolver: false,
                _focusManager: false
            } as any,
            { autoBind: true }
        );

        this._layoutResolver = new LayoutResolver(
            this._fields,
            this._activeTabs,
            this.evaluateRules.bind(this)
        );
        this._focusManager = new FocusManager(this._fields);
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
        const field = this._fields.get(name);
        if (field) {
            return field;
        }

        const parts = name.split(".");
        if (parts.length > 1) {
            let current: IField | undefined = this._fields.get(parts[0]);
            for (let i = 1; i < parts.length && current; i++) {
                if (isObjectField(current)) {
                    if (current.isList) {
                        const index = parseInt(parts[i], 10);
                        if (!isNaN(index)) {
                            const item = current.items[index];
                            if (item && i + 1 < parts.length) {
                                current = item.children.get(parts[i + 1]);
                                i++;
                            } else {
                                current = undefined;
                            }
                            continue;
                        }
                    }
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

        const activations = this._focusManager.buildFocusPath(name, this._layout);
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
                this._builders.delete(name);
                this.removeField(name);
                continue;
            }

            this._builders.set(name, builder);
            const fieldConfig = builder.build(name);
            const field = this._createField(fieldConfig);
            field.setForm(this);

            this._fields.set(name, field);
        }

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
            return this._layoutMutator.accessNode(this._layout, factoryOrNodeId);
        }

        this._layout = this._layoutMutator.applyModifications(this._layout, factoryOrNodeId);
        this._registerObjectNodeLayouts(this._layout);
        this._propagateAncestorRules();
    }

    removeField(name: string): void {
        this._fields.delete(name);
        this._baseline.delete(name);
        this._layout = this._layoutMutator.removeFromLayout(this._layout, name);
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
        this._submitCount = 0;
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
        this._submitCount = 0;
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

    get submitCount(): number {
        return this._submitCount;
    }

    get errors(): IFormError[] {
        if (!this._submitted) {
            return [];
        }
        const ruleErrorPaths = new Set(this._formRuleErrors.filter(e => e.path).map(e => e.path));
        const errors: IFormError[] = [];

        const collectErrors = (
            fields: Map<string, IField>,
            pathPrefix: string,
            trail: string[]
        ) => {
            for (const [, field] of fields) {
                const path = pathPrefix ? `${pathPrefix}.${field.name}` : field.name;
                const segment = field.config.label || field.name;
                if (isObjectField(field)) {
                    if (field.vm.validation.isValid === false && !ruleErrorPaths.has(path)) {
                        errors.push({
                            path,
                            label: field.config.label,
                            breadcrumb: [...trail, segment],
                            message: field.vm.validation.message || "Invalid value."
                        });
                    }
                    if (field.config.isList) {
                        for (const [index, item] of field.items.entries()) {
                            collectErrors(item.children, `${path}.${index}`, [
                                ...trail,
                                `${segment} [${index + 1}]`
                            ]);
                        }
                    } else {
                        collectErrors(field.children, path, [...trail, segment]);
                    }
                } else if (field.vm.validation.isValid === false && !ruleErrorPaths.has(path)) {
                    errors.push({
                        path,
                        label: field.config.label,
                        breadcrumb: [...trail, segment],
                        message: field.vm.validation.message || "Invalid value."
                    });
                }
            }
        };

        collectErrors(this._fields, "", []);
        return [...errors, ...this._formRuleErrors];
    }

    addRule(rule: FormRule): void {
        this._formRules.push(rule);
    }

    setLayout(factory: (layout: ILayoutBuilder) => ILayoutNodeBuilder[]): void {
        this._layout = LayoutBuilderFactory.buildNodes(factory(LayoutBuilderFactory.create()));
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
            this._submitCount++;
        });
        return isValid;
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
            layout: this._layoutResolver.resolve(this._layout),
            errors: this.errors,
            isDirty: this.isDirty,
            isValid: this._isValid,
            submitCount: this._submitCount,
            focusField: (path: string) => this.focusField(path),
            getData: () => this.getData() as Record<string, unknown>,
            setData: (data: Record<string, unknown>) => this.setData(data)
        };
    }

    get registry(): IFieldBuilderRegistry {
        return this._registry;
    }

    public resolveChildLayout(layout: LayoutNode[], children: Map<string, IField>): LayoutNodeVM[] {
        return this._layoutResolver.resolveChildLayout(layout, children);
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
        LayoutBuilderFactory.collectBuilders(this._fields, this._builders, pred, result);
        return result;
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
        const layoutFieldIds = new Set(LayoutBuilderFactory.collectFieldIds(this._layout));

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

    private _createField(config: any): IField {
        if (config.childBuilders) {
            return new ObjectField(config as IObjectFieldConfig);
        }
        return new Field(config);
    }
}
