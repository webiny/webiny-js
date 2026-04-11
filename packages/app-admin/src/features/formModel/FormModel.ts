import { makeAutoObservable, computed, toJS, runInAction } from "mobx";
import { Field } from "./Field.js";
import { createFieldBuilderRegistry } from "./FieldBuilder.js";
import type {
    IFormModel,
    IField,
    IFieldBuilder,
    IFieldBuilderRegistry,
    IFormVM,
    IFormError,
    IFormModelConfig,
    ILayoutBuilder,
    ILayoutNodeHandle,
    ILayoutModifier,
    IPositionedLayoutNode,
    LayoutNode,
    LayoutPosition,
    LayoutNodeVM,
    IRowNode,
    IRowNodeVM
} from "./abstractions.js";

const layoutAPI: ILayoutBuilder = {
    row(...fieldIds: string[]): IRowNode {
        return { type: "row", fieldIds };
    }
};

export class FormModel implements IFormModel {
    private _fields = new Map<string, Field>();
    private _layout: LayoutNode[] = [];
    private _baseline = new Map<string, unknown>();
    private _submitted = false;
    private _validateOnChange = false;
    private _isValid: boolean | null = null;
    private _errors: IFormError[] = [];

    constructor(config: IFormModelConfig) {
        const registry = createFieldBuilderRegistry();
        const builders = config.fields(registry);

        // Build fields from builders
        for (const [name, builder] of Object.entries(builders)) {
            const fieldConfig = builder.build(name);
            const field = new Field(fieldConfig);
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

    field(name: string): IField {
        // Try exact match first (supports dotted field names like "properties.language").
        const field = this._fields.get(name);

        if (!field) {
            throw new Error(`Field "${name}" not found.`);
        }

        return field;
    }

    fields(
        factory: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder | undefined>
    ): void {
        const registry = createFieldBuilderRegistry();
        const builders = factory(registry);

        for (const [name, builder] of Object.entries(builders)) {
            if (builder === undefined) {
                // undefined = remove
                this.removeField(name);
                continue;
            }

            const fieldConfig = builder.build(name);
            const field = new Field(fieldConfig);
            field.setForm(this);

            // Replace or add — same operation on the map
            this._fields.set(name, field);
        }

        // Re-snapshot baseline to include new fields
        this._snapshotBaseline();
    }

    layout(factory: (layout: ILayoutModifier) => (LayoutNode | IPositionedLayoutNode)[]): void {
        const removals: string[] = [];

        const modifierLayoutAPI: ILayoutModifier = {
            row(...fieldIds: string[]): ILayoutNodeHandle {
                const node: IRowNode = { type: "row", fieldIds };
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
            },
            remove(target: string): void {
                removals.push(target);
            }
        };

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
            data[name] = toJS(field.getValue());
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
        this._errors = [];
    }

    reset(): void {
        for (const [name, field] of this._fields) {
            const baselineValue = this._baseline.get(name);
            field.setValueSilent(baselineValue ?? field.config.defaultValue ?? null);
        }
        this._resetAllValidation();
        this._submitted = false;
        this._isValid = null;
        this._errors = [];
    }

    get isDirty(): boolean {
        for (const [name, field] of this._fields) {
            const baseline = this._baseline.get(name);
            const current = field.getValue();
            if (!Object.is(toJS(current), toJS(baseline))) {
                return true;
            }
        }
        return false;
    }

    get isValid(): boolean | null {
        return this._isValid;
    }

    get errors(): IFormError[] {
        return this._errors;
    }

    async validate(): Promise<boolean> {
        const errors: IFormError[] = [];

        for (const [, field] of this._fields) {
            const valid = await field.validate();
            if (!valid) {
                errors.push({
                    path: field.name,
                    label: field.config.label,
                    message: field.vm.validation.message || "Invalid value."
                });
            }
        }

        const isValid = errors.length === 0;
        runInAction(() => {
            this._errors = errors;
            this._isValid = isValid;
            this._submitted = true;
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
            layout: this._resolveLayout(),
            errors: this._errors,
            isDirty: this.isDirty,
            isValid: this._isValid
        };
    }

    getField(name: string): Field | undefined {
        return this._fields.get(name);
    }

    getFields(): Map<string, Field> {
        return this._fields;
    }

    private _resolveLayout(): LayoutNodeVM[] {
        return this._layout
            .map(node => this._resolveLayoutNode(node))
            .filter(Boolean) as LayoutNodeVM[];
    }

    private _resolveLayoutNode(node: LayoutNode): LayoutNodeVM | null {
        if (node.type === "row") {
            return this._resolveRowNode(node);
        }
        return null;
    }

    private _resolveRowNode(node: IRowNode): IRowNodeVM | null {
        const fields = node.fieldIds
            .map(id => this._fields.get(id))
            .filter((f): f is Field => f !== undefined && f.visible)
            .map(f => f.vm);

        if (fields.length === 0) {
            return null;
        }

        return { type: "row", fields };
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
        const layoutFieldIds = new Set<string>();
        for (const node of this._layout) {
            if (node.type === "row") {
                for (const id of node.fieldIds) {
                    layoutFieldIds.add(id);
                }
            }
        }

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
     * Find the index of a layout row that contains the given field ID.
     * Returns -1 if not found.
     */
    private _findLayoutIndex(layout: LayoutNode[], target: string): number {
        return layout.findIndex(node => node.type === "row" && node.fieldIds.includes(target));
    }

    /**
     * Remove a field ID from all layout rows. Drops rows that become empty.
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

    private _isPositionedNode(
        entry: LayoutNode | IPositionedLayoutNode
    ): entry is IPositionedLayoutNode {
        return "node" in entry;
    }
}
