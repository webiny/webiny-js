import type { z } from "zod";
import type {
    IFieldConfig,
    IValueOption,
    IFormModel,
    IFieldBuilder,
    IFieldBuilderRegistry,
    IFieldTypeFactory,
    IRule,
    BeforeChangeCallback,
    AfterChangeCallback,
    AfterSetValueCallback,
    ComputedFieldCallback,
    OnBlurCallback,
    CloneValueCallback
} from "./abstractions.js";

/**
 * Base FieldBuilder with fluent API.
 * Each method mutates `this` and returns `this` for chaining.
 */
export class FieldBuilder<TType extends string = string> implements IFieldBuilder {
    protected _config: IFieldConfig;

    constructor(type: TType) {
        this._config = {
            name: "",
            type,
            hidden: false,
            required: false,
            disabled: false
        };
    }

    get fieldType(): string {
        return this._config.type;
    }

    label(text: string): this {
        this._config.label = text;
        return this;
    }

    help(text: string): this {
        this._config.help = text;
        return this;
    }

    description(text: string): this {
        this._config.description = text;
        return this;
    }

    note(text: string): this {
        this._config.note = text;
        return this;
    }

    placeholder(text: string): this {
        this._config.placeholder = text;
        return this;
    }

    schema(zodSchema: z.ZodTypeAny): this {
        this._config.schema = zodSchema;
        return this;
    }

    defaultValue(value: unknown): this {
        this._config.defaultValue = value;
        return this;
    }

    renderer(name: string, settings?: Record<string, unknown>): this {
        this._config.renderer = name;
        this._config.rendererSettings = settings;
        return this;
    }

    list(): this {
        this._config.isList = true;
        return this;
    }

    hidden(): this {
        this._config.hidden = true;
        return this;
    }

    required(message?: string): this {
        this._config.required = true;
        this._config.requiredMessage = message;
        return this;
    }

    requiredWhen(fn: (form: IFormModel) => boolean, message?: string): this {
        if (!this._config.requiredWhenCallbacks) {
            this._config.requiredWhenCallbacks = [];
        }
        this._config.requiredWhenCallbacks.push({ fn, message });
        return this;
    }

    computed(fn: ComputedFieldCallback): this {
        this._config.computed = fn;
        this._config.computedUntilDirty = undefined;
        return this;
    }

    computedUntilDirty(fn: ComputedFieldCallback): this {
        this._config.computedUntilDirty = fn;
        this._config.computed = undefined;
        return this;
    }

    disabled(value = true): this {
        this._config.disabled = value;
        return this;
    }

    rules(rules: IRule[]): this {
        if (!this._config.rules) {
            this._config.rules = [];
        }
        this._config.rules.push(...rules);
        return this;
    }

    beforeChange(fn: BeforeChangeCallback): this {
        if (!this._config.beforeChangeCallbacks) {
            this._config.beforeChangeCallbacks = [];
        }
        this._config.beforeChangeCallbacks.push(fn);
        return this;
    }

    afterChange(fn: AfterChangeCallback): this {
        if (!this._config.afterChangeCallbacks) {
            this._config.afterChangeCallbacks = [];
        }
        this._config.afterChangeCallbacks.push(fn);
        return this;
    }

    afterSetValue(fn: AfterSetValueCallback): this {
        if (!this._config.afterSetValueCallbacks) {
            this._config.afterSetValueCallbacks = [];
        }
        this._config.afterSetValueCallbacks.push(fn);
        return this;
    }

    onBlur(fn: OnBlurCallback): this {
        if (!this._config.onBlurCallbacks) {
            this._config.onBlurCallbacks = [];
        }
        this._config.onBlurCallbacks.push(fn);
        return this;
    }

    cloneValue(fn: CloneValueCallback): this {
        this._config.cloneValue = fn;
        return this;
    }

    getTags(): string[] {
        return this._config.tags ?? [];
    }

    tags(tags: string[]): this {
        this._config.tags = tags;
        return this;
    }

    options(opts: IValueOption[] | ((form: IFormModel) => IValueOption[])): this {
        this._config.options = opts;
        if (this._config.renderer === "textInput" || this._config.renderer === "numberInput") {
            this._config.renderer = "dropdown";
        }
        return this;
    }

    /**
     * Normalize value before it's set. If field value is an array, this method runs on each individual value in the array.
     * Useful for converting strings to numbers, ensuring specific date format, etc.
     * @param value
     */
    normalizeValue(value: unknown): unknown {
        return value;
    }

    build(name: string): IFieldConfig {
        return { ...this._config, name, normalizeValue: (v: unknown) => this.normalizeValue(v) };
    }
}

export function createFieldBuilderRegistry(factories: IFieldTypeFactory[]): IFieldBuilderRegistry {
    const fieldTypes = new Map<string, IFieldTypeFactory>();
    for (const factory of factories) {
        fieldTypes.set(factory.type, factory);
    }

    const proxy: IFieldBuilderRegistry = new Proxy({} as IFieldBuilderRegistry, {
        get(_target, prop: string) {
            const factory = fieldTypes.get(prop);
            if (factory) {
                return () => factory.create(proxy);
            }
            return undefined;
        }
    });
    return proxy;
}
