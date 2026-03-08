import { z } from "zod";
import type { FieldConfig } from "./types.js";
import type { IFieldBuilderRegistry } from "./abstractions.js";

// Make FieldBuilder return the Zod type it produces
export abstract class FieldBuilder<TZod extends z.ZodTypeAny> {
    protected config: Partial<FieldConfig> = {
        validation: []
    };
    protected zodSchema: TZod;

    constructor(type: string, initialSchema: TZod) {
        this.config.type = type;
        this.zodSchema = initialSchema;
    }

    label(text: string): this {
        this.config.label = text;
        return this;
    }

    help(text: string): this {
        this.config.help = text;
        return this;
    }

    placeholder(text: string): this {
        this.config.placeholder = text;
        return this;
    }

    toConfig(): FieldConfig {
        return {
            fieldId: "",
            type: this.config.type!,
            label: this.config.label,
            help: this.config.help,
            placeholder: this.config.placeholder,
            validation: this.config.validation || [],
            settings: this.config.settings || {},
            zodSchema: this.zodSchema
        };
    }

    getZodSchema(): TZod {
        return this.zodSchema;
    }
}

// Text Field Builder - properly track type transformations
export class TextFieldBuilder<TZod extends z.ZodString = z.ZodString> extends FieldBuilder<TZod> {
    constructor(schema?: TZod) {
        super("text", (schema || z.string()) as TZod);
    }

    required(message?: string): TextFieldBuilder<z.ZodString> {
        const newSchema = this.zodSchema.min(1, message || "Field is required");
        this.zodSchema = newSchema;
        this.config.validation?.push({
            name: "required",
            message: message || "Field is required",
            settings: {}
        });
        return this;
    }

    minLength(length: number, message?: string): this {
        this.zodSchema = this.zodSchema.min(length, message) as TZod;
        return this;
    }

    maxLength(length: number, message?: string): this {
        this.zodSchema = this.zodSchema.max(length, message) as TZod;
        return this;
    }

    slug(): this {
        return this.addStringValidator(
            this.zodSchema.regex(
                /^[a-z0-9-]+$/,
                "Must be a valid slug (lowercase letters, numbers, and hyphens only)"
            ),
            "slug",
            "Must be a valid slug"
        );
    }

    email(): this {
        return this.addStringValidator(
            this.zodSchema.email("Must be a valid email"),
            "email",
            "Must be a valid email"
        );
    }

    url(): this {
        return this.addStringValidator(
            this.zodSchema.url("Must be a valid URL"),
            "url",
            "Must be a valid URL"
        );
    }

    private addStringValidator(schema: z.ZodString, name: string, message: string): this {
        this.zodSchema = schema as TZod;
        this.config.validation?.push({ name, message, settings: {} });
        return this;
    }

    unique(): this {
        this.config.validation?.push({
            name: "unique",
            message: "Value must be unique",
            settings: {}
        });
        return this;
    }
}

// Object Field Builder - track the shape type
export class ObjectFieldBuilder<TShape extends z.ZodRawShape> extends FieldBuilder<
    z.ZodObject<TShape>
> {
    private readonly nestedFields: FieldConfig[] = [];

    constructor(
        fields: (registry: IFieldBuilderRegistry) => {
            [K in keyof TShape]: FieldBuilder<TShape[K] & z.ZodTypeAny>;
        },
        registry: IFieldBuilderRegistry
    ) {
        const fieldBuilders = fields(registry);
        const shape = {} as TShape;
        const nestedConfigs: FieldConfig[] = [];

        for (const [fieldId, builder] of Object.entries(fieldBuilders) as Array<
            [keyof TShape, FieldBuilder<any>]
        >) {
            const config = builder.toConfig();
            config.fieldId = fieldId as string;
            nestedConfigs.push(config);
            shape[fieldId] = builder.getZodSchema() as TShape[keyof TShape];
        }

        super("object", z.object(shape));
        this.nestedFields = nestedConfigs;
        this.config.fields = nestedConfigs;
    }

    optional(): ObjectFieldBuilder<TShape> & {
        getZodSchema(): z.ZodOptional<z.ZodObject<TShape>>;
    } {
        this.zodSchema = this.zodSchema.optional();
        return this;
    }

    nullable(): ObjectFieldBuilder<TShape> & {
        getZodSchema(): z.ZodNullable<z.ZodObject<TShape>>;
    } {
        this.zodSchema = this.zodSchema.nullable();
        return this;
    }

    override toConfig(): FieldConfig {
        const config = super.toConfig();
        config.fields = this.nestedFields;
        return config;
    }
}
