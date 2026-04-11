import { makeAutoObservable, computed, toJS } from "mobx";
import { Field } from "./Field.js";
import { createFieldBuilderRegistry } from "./FieldBuilder.js";
import type {
    IFormModel,
    IField,
    IFormVM,
    IFormError,
    IFormModelConfig,
    ILayoutAPI,
    LayoutNode,
    LayoutNodeVM,
    IRowNode,
    IRowNodeVM
} from "./abstractions.js";

const layoutAPI: ILayoutAPI = {
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
        const parts = name.split(".");
        const field = this._fields.get(parts[0]);

        if (!field) {
            throw new Error(`Field "${name}" not found.`);
        }

        if (parts.length > 1) {
            throw new Error(`Nested field access ("${name}") is not yet supported.`);
        }

        return field;
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

        this._errors = errors;
        this._isValid = errors.length === 0;
        this._submitted = true;
        return this._isValid;
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
            .filter((f): f is Field => f !== undefined && !f.config.hidden)
            .map(f => f.vm);

        if (fields.length === 0) {
            return null;
        }

        return { type: "row", fields };
    }

    private _generateDefaultLayout(): LayoutNode[] {
        const layout: LayoutNode[] = [];
        for (const [name, field] of this._fields) {
            if (!field.config.hidden) {
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
            if (!field.config.hidden && !layoutFieldIds.has(name)) {
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
}
