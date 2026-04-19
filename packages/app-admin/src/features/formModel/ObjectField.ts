import { makeAutoObservable, runInAction, toJS } from "mobx";
import { Field } from "./Field.js";
import type {
    IObjectFieldConfig,
    IObjectField,
    IListItemField,
    IField,
    IObjectFieldVM,
    IFieldVM,
    IFieldValidation,
    IFormModel,
    IFieldBuilder,
    FieldTypeMap,
    BeforeChangeCallback,
    AfterChangeCallback,
    AfterSetValueCallback,
    OnBlurCallback
} from "./abstractions.js";

function createChildFields(
    childBuilders: Record<string, IFieldBuilder>,
    form: IFormModel | null
): Map<string, IField> {
    const children = new Map<string, IField>();
    for (const [name, builder] of Object.entries(childBuilders)) {
        const config = builder.build(name);
        const field = createFieldFromConfig(config, form);
        children.set(name, field);
    }
    return children;
}

function createFieldFromConfig(config: any, form: IFormModel | null): IField {
    if (config.childBuilders) {
        const objField = new ObjectField(config as IObjectFieldConfig);
        if (form) {
            objField.setForm(form);
        }
        return objField;
    }
    const field = new Field(config);
    if (form) {
        field.setForm(form);
    }
    return field;
}

function hydrateChildren(
    children: Map<string, IField>,
    data: Record<string, unknown> | null | undefined
): void {
    if (!data) {
        return;
    }
    for (const [name, field] of children) {
        if (name in data) {
            field.setValueSilent(data[name]);
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

async function validateChildren(children: Map<string, IField>): Promise<boolean> {
    let allValid = true;
    for (const [, field] of children) {
        const valid = await field.validate();
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

    constructor(config: IObjectFieldConfig) {
        this.config = config;
        this._base = new Field({
            ...config,
            type: "object",
            renderer: config.renderer ?? "object"
        });
        this._children = createChildFields(config.childBuilders, null);

        makeAutoObservable(this, {
            config: false
        });
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

    setDisabled(value: boolean): void {
        this._base.setDisabled(value);
    }

    setVisible(value: boolean): void {
        this._base.setVisible(value);
    }

    setForm(form: IFormModel): void {
        this._form = form;
        this._base.setForm(form);
        for (const [, field] of this._children) {
            field.setForm(form);
        }
        for (const item of this._items) {
            for (const [, field] of item.children) {
                field.setForm(form);
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

    blur(): void {
        this._base.blur();
    }

    remove(): void {
        this._base.remove();
    }

    // --- Object-specific ---

    get isList(): boolean {
        return this.config.isList;
    }

    get children(): Map<string, IField> {
        return this._children;
    }

    get items(): IListItemField[] {
        return this._items.map(item => ({
            key: item.key,
            children: item.children,
            getData: () => getChildrenData(item.children)
        }));
    }

    getChild(name: string): IField | undefined {
        return this._children.get(name);
    }

    getListItemChild(index: number, name: string): IField | undefined {
        const item = this._items[index];
        return item?.children.get(name);
    }

    getData(): any {
        if (this.config.isList) {
            return this._items.map(item => getChildrenData(item.children));
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
                    this._addItemInternal(itemData);
                }
            }
        } else {
            hydrateChildren(this._children, value as Record<string, unknown>);
        }
    }

    addItem(data?: Record<string, unknown>): void {
        this._addItemInternal(data);
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

    private _addItemInternal(data?: Record<string, unknown>): void {
        const children = createChildFields(this.config.childBuilders, this._form);
        if (data) {
            hydrateChildren(children, data);
        }
        const key = `item_${++itemKeyCounter}`;
        this._items.push({ key, children });
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
            required: baseVm.required,
            disabled: baseVm.disabled,
            renderer: baseVm.renderer,
            rendererSettings: baseVm.rendererSettings,
            onChange: (value: unknown) => this.setValue(value),
            onBlur: () => this.blur(),
            isList: this.config.isList,
            fields: this.config.isList
                ? []
                : Array.from(this._children.values())
                      .filter(f => f.visible)
                      .map(f => f.vm),
            items: this.config.isList
                ? this._items.map((item, index) => ({
                      key: item.key,
                      fields: Array.from(item.children.values())
                          .filter(f => f.visible)
                          .map(f => f.vm),
                      remove: () => this.removeItem(index),
                      moveUp: () => this.moveItem(index, index - 1),
                      moveDown: () => this.moveItem(index, index + 1)
                  }))
                : [],
            addItem: () => this.addItem(),
            removeItem: (index: number) => this.removeItem(index),
            moveItem: (from: number, to: number) => this.moveItem(from, to)
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

    async validate(): Promise<boolean> {
        if (this.config.required) {
            if (this.config.isList && this._items.length === 0) {
                this.setValidation({
                    isValid: false,
                    message: this.config.requiredMessage || "This field is required."
                });
                return false;
            }
            if (!this.config.isList) {
                const data = this.getData();
                const hasAnyValue = Object.values(data).some(
                    v => v !== null && v !== undefined && v !== ""
                );
                if (!hasAnyValue) {
                    this.setValidation({
                        isValid: false,
                        message: this.config.requiredMessage || "This field is required."
                    });
                    return false;
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
                const valid = await validateChildren(item.children);
                if (!valid) {
                    allValid = false;
                }
            }
        } else {
            allValid = await validateChildren(this._children);
        }

        runInAction(() => {
            this.setValidation({ isValid: allValid });
        });

        return allValid;
    }
}
