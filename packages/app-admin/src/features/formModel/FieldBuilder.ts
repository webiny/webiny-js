import type { z } from "zod";
import type {
    IFieldConfig,
    IValueOption,
    IFormModel,
    IFieldBuilder,
    ISelectFieldBuilder,
    IFieldBuilderRegistry,
    BeforeChangeCallback,
    AfterChangeCallback,
    OnBlurCallback
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

    renderer(name: string): this {
        this._config.renderer = name;
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

    disabled(value = true): this {
        this._config.disabled = value;
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

    onBlur(fn: OnBlurCallback): this {
        if (!this._config.onBlurCallbacks) {
            this._config.onBlurCallbacks = [];
        }
        this._config.onBlurCallbacks.push(fn);
        return this;
    }

    build(name: string): IFieldConfig {
        return { ...this._config, name };
    }
}

/**
 * Text field builder.
 */
export class TextFieldBuilder extends FieldBuilder<"text"> {
    constructor() {
        super("text");
        this._config.renderer = "text";
    }
}

/**
 * Select field builder with .options() support.
 */
export class SelectFieldBuilder extends FieldBuilder<"select"> implements ISelectFieldBuilder {
    constructor() {
        super("select");
        this._config.renderer = "select";
    }

    options(opts: IValueOption[] | ((form: IFormModel) => IValueOption[])): this {
        this._config.options = opts;
        return this;
    }
}

/**
 * Factory interface for creating field builders.
 */
export interface IFieldTypeFactory {
    readonly type: string;
    create(): FieldBuilder;
}

/**
 * Proxy-based FieldBuilderRegistry.
 */
class FieldBuilderRegistryImpl implements IFieldBuilderRegistry {
    private fieldTypes = new Map<string, IFieldTypeFactory>();

    constructor(factories?: IFieldTypeFactory[]) {
        this.fieldTypes.set("text", { type: "text", create: () => new TextFieldBuilder() });
        this.fieldTypes.set("select", { type: "select", create: () => new SelectFieldBuilder() });

        if (factories) {
            for (const factory of factories) {
                this.fieldTypes.set(factory.type, factory);
            }
        }

        const proxy = new Proxy(this, {
            get(target, prop: string) {
                const factory = target.fieldTypes.get(prop);
                if (factory) {
                    return () => factory.create();
                }
                return target[prop as keyof typeof target];
            }
        }) as any;

        return proxy;
    }

    // These exist for TypeScript but are intercepted by the Proxy
    text(): TextFieldBuilder {
        throw new Error("Should be intercepted by Proxy");
    }
    select(): SelectFieldBuilder {
        throw new Error("Should be intercepted by Proxy");
    }
}

export function createFieldBuilderRegistry(factories?: IFieldTypeFactory[]): IFieldBuilderRegistry {
    return new FieldBuilderRegistryImpl(factories);
}
