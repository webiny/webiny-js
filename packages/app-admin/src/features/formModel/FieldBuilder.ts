import type { z } from "zod";
import type {
    IFieldConfig,
    IObjectFieldConfig,
    IValueOption,
    IFormModel,
    IFieldBuilder,
    ISelectFieldBuilder,
    IObjectFieldBuilder,
    IFieldBuilderRegistry,
    IRule,
    ITemplate,
    ITemplateConfig,
    BeforeChangeCallback,
    AfterChangeCallback,
    AfterSetValueCallback,
    ComputedFieldCallback,
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
        this._config.renderer = "input";
    }
}

/**
 * Select field builder with .options() support.
 */
export class SelectFieldBuilder extends FieldBuilder<"select"> implements ISelectFieldBuilder {
    constructor() {
        super("select");
        this._config.renderer = "dropdown";
    }

    options(opts: IValueOption[] | ((form: IFormModel) => IValueOption[])): this {
        this._config.options = opts;
        return this;
    }
}

/**
 * Object field builder with .fields(), .list(), .listSchema(), .templates() support.
 *
 * Templates and .fields() are mutually exclusive — an object either defines its own
 * children directly or delegates to templates. Calling both throws at build time.
 */
export class ObjectFieldBuilder extends FieldBuilder<"object"> implements IObjectFieldBuilder {
    private _childBuilders: Record<string, IFieldBuilder> = {};
    private _isList = false;
    private _listSchema?: z.ZodTypeAny;
    private _templates?: ITemplateConfig[];

    constructor() {
        super("object");
        this._config.renderer = "object";
    }

    fields(fn: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder>): this {
        const registry = createFieldBuilderRegistry();
        this._childBuilders = fn(registry);
        return this;
    }

    list(): this {
        this._isList = true;
        return this;
    }

    listSchema(schema: z.ZodTypeAny): this {
        this._listSchema = schema;
        return this;
    }

    templates(templates: ITemplate[]): this {
        const seen = new Set<string>();
        this._templates = templates.map(t => {
            if (t.id === "_templateId") {
                throw new Error(`Template id "_templateId" is reserved. Choose a different id.`);
            }
            if (seen.has(t.id)) {
                throw new Error(`Duplicate template id "${t.id}".`);
            }
            seen.add(t.id);

            const registry = createFieldBuilderRegistry();
            const childBuilders = t.fields(registry);
            if ("_templateId" in childBuilders) {
                throw new Error(
                    `Template "${t.id}" defines a reserved field "_templateId". ` +
                        `The discriminator is added automatically.`
                );
            }
            return {
                id: t.id,
                name: t.name,
                childBuilders,
                visible: t.visible
            };
        });
        return this;
    }

    override build(name: string): IObjectFieldConfig {
        if (this._templates && Object.keys(this._childBuilders).length > 0) {
            throw new Error(
                `Object field "${name}" has both .fields() and .templates() defined. ` +
                    `Templates are mutually exclusive with .fields(); each template defines its own children.`
            );
        }

        return {
            ...this._config,
            name,
            childBuilders: this._childBuilders,
            isList: this._isList,
            listSchema: this._listSchema,
            templates: this._templates
        };
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
        this.fieldTypes.set("object", { type: "object", create: () => new ObjectFieldBuilder() });

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
    object(): ObjectFieldBuilder {
        throw new Error("Should be intercepted by Proxy");
    }
}

export function createFieldBuilderRegistry(factories?: IFieldTypeFactory[]): IFieldBuilderRegistry {
    return new FieldBuilderRegistryImpl(factories);
}
