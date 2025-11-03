```ts
// FieldBuilder.ts
import { z } from "zod";
import type { FieldConfig, ValidationRule } from "./types.js";
import type { FieldBuilderRegistry } from "./FieldBuilderRegistry.js";

// Make FieldBuilder return the Zod type it produces
export abstract class FieldBuilder<TZod extends z.ZodTypeAny> {
    protected config: Partial<FieldConfig> = {
        validation: []
    };
    protected zodSchema: TZod;

    constructor(
        type: string,
        initialSchema: TZod
    ) {
        this.config.type = type;
        this.zodSchema = initialSchema;
    }

    label(text: string): this {
        this.config.label = text;
        return this;
    }

    helpText(text: string): this {
        this.config.helpText = text;
        return this;
    }

    placeholder(text: string): this {
        this.config.placeholderText = text;
        return this;
    }

    toConfig(): FieldConfig {
        return {
            fieldId: '',
            type: this.config.type!,
            label: this.config.label,
            helpText: this.config.helpText,
            placeholderText: this.config.placeholderText,
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
        super('text', (schema || z.string()) as TZod);
    }

    required(message?: string): TextFieldBuilder<z.ZodString> {
        const newSchema = (this.zodSchema as z.ZodString).min(1, message || 'Field is required');
        this.zodSchema = newSchema as any;
        this.config.validation?.push({
            name: 'required',
            message: message || 'Field is required',
            settings: {}
        });
        return this as any;
    }

    minLength(length: number, message?: string): this {
        this.zodSchema = (this.zodSchema as z.ZodString).min(length, message) as TZod;
        return this;
    }

    maxLength(length: number, message?: string): this {
        this.zodSchema = (this.zodSchema as z.ZodString).max(length, message) as TZod;
        return this;
    }

    slug(): this {
        this.zodSchema = (this.zodSchema as z.ZodString).regex(
            /^[a-z0-9-]+$/,
            'Must be a valid slug (lowercase letters, numbers, and hyphens only)'
        ) as TZod;
        this.config.validation?.push({
            name: 'slug',
            message: 'Must be a valid slug',
            settings: {}
        });
        return this;
    }

    email(): this {
        this.zodSchema = (this.zodSchema as z.ZodString).email('Must be a valid email') as TZod;
        this.config.validation?.push({
            name: 'email',
            message: 'Must be a valid email',
            settings: {}
        });
        return this;
    }

    url(): this {
        this.zodSchema = (this.zodSchema as z.ZodString).url('Must be a valid URL') as TZod;
        this.config.validation?.push({
            name: 'url',
            message: 'Must be a valid URL',
            settings: {}
        });
        return this;
    }

    unique(): this {
        this.config.validation?.push({
            name: 'unique',
            message: 'Value must be unique',
            settings: {}
        });
        return this;
    }
}

// Object Field Builder - track the shape type
export class ObjectFieldBuilder<TShape extends z.ZodRawShape> extends FieldBuilder<z.ZodObject<TShape>> {
    private nestedFields: FieldConfig[] = [];

    constructor(
        fields: (registry: FieldBuilderRegistry) => { [K in keyof TShape]: FieldBuilder<TShape[K]> },
        registry: FieldBuilderRegistry
    ) {
        const fieldBuilders = fields(registry);
        const shape = {} as TShape;
        const nestedConfigs: FieldConfig[] = [];

        for (const [fieldId, builder] of Object.entries(fieldBuilders) as Array<[keyof TShape, FieldBuilder<any>]>) {
            const config = builder.toConfig();
            config.fieldId = fieldId as string;
            nestedConfigs.push(config);
            shape[fieldId] = builder.getZodSchema() as TShape[keyof TShape];
        }

        super('object', z.object(shape));
        this.nestedFields = nestedConfigs;
        this.config.fields = nestedConfigs;
    }

    optional(): ObjectFieldBuilder<TShape> & { getZodSchema(): z.ZodOptional<z.ZodObject<TShape>> } {
        this.zodSchema = this.zodSchema.optional() as any;
        return this as any;
    }

    nullable(): ObjectFieldBuilder<TShape> & { getZodSchema(): z.ZodNullable<z.ZodObject<TShape>> } {
        this.zodSchema = this.zodSchema.nullable() as any;
        return this as any;
    }

    override toConfig(): FieldConfig {
        const config = super.toConfig();
        config.fields = this.nestedFields;
        return config;
    }
}
```

```ts
// FieldBuilderRegistry.ts
import { z } from "zod";
import { createImplementation } from "@webiny/di";
import { TextFieldBuilder, ObjectFieldBuilder, type FieldBuilder } from "./FieldBuilder.js";
import {
    FieldBuilderRegistry as RegistryAbstraction,
    type IFieldBuilderRegistry
} from "./abstractions.js";

class FieldBuilderRegistryImpl implements IFieldBuilderRegistry {
    text(): TextFieldBuilder<z.ZodString> {
        return new TextFieldBuilder();
    }

    object<TShape extends z.ZodRawShape>(
        fields: (registry: IFieldBuilderRegistry) => {
            [K in keyof TShape]: FieldBuilder<TShape[K]>;
        }
    ): ObjectFieldBuilder<TShape> {
        return new ObjectFieldBuilder(fields, this);
    }
}

export const FieldBuilderRegistry = createImplementation({
    abstraction: RegistryAbstraction,
    implementation: FieldBuilderRegistryImpl,
    dependencies: []
});
```

```ts
// FieldDefinitionsBuilder.ts
import { z } from "zod";
import type { FieldBuilder } from "./FieldBuilder.js";
import type { IFieldBuilderRegistry } from "./abstractions.js";
import type { FieldConfig, FieldBuilderConfig } from "./types.js";

export class FieldDefinitionsBuilder<TFields extends z.ZodRawShape = {}> {
    private fields = new Map<string, FieldBuilderConfig>();

    constructor(private registry: IFieldBuilderRegistry) {}

    // Keep the old .field() method for internal use
    field<K extends string, TZod extends z.ZodTypeAny>(
        name: K,
        configure: (field: IFieldBuilderRegistry) => FieldBuilder<TZod>
    ): FieldDefinitionsBuilder<TFields & Record<K, TZod>> {
        const fieldBuilder = configure(this.registry);
        const config = fieldBuilder.toConfig();
        config.fieldId = name;

        this.fields.set(name, {
            fieldId: name,
            config,
            zodSchema: fieldBuilder.getZodSchema()
        });

        return this as any;
    }

    // Internal method to build from object
    __fromObject<TShape extends Record<string, FieldBuilder<any>>>(
        shape: TShape
    ): FieldDefinitionsBuilder<{ [K in keyof TShape]: ReturnType<TShape[K]["getZodSchema"]> }> {
        for (const [fieldId, fieldBuilder] of Object.entries(shape)) {
            const config = fieldBuilder.toConfig();
            config.fieldId = fieldId;

            this.fields.set(fieldId, {
                fieldId,
                config,
                zodSchema: fieldBuilder.getZodSchema()
            });
        }

        return this as any;
    }

    __toZodSchema(): z.ZodObject<TFields> {
        const schemaShape = {} as TFields;

        for (const [fieldId, { zodSchema }] of this.fields) {
            schemaShape[fieldId as keyof TFields] = zodSchema as TFields[keyof TFields];
        }

        return z.object(schemaShape);
    }

    __getFields(): FieldConfig[] {
        return Array.from(this.fields.values()).map(f => f.config);
    }

    __getFieldsMap(): Map<string, FieldBuilderConfig> {
        return new Map(this.fields);
    }
}

// Updated factory function - now takes an object!
export function createFieldDefinitions<TShape extends Record<string, FieldBuilder<any>>>(
    factory: (fields: IFieldBuilderRegistry) => TShape
): FieldDefinitionsFactory<{ [K in keyof TShape]: ReturnType<TShape[K]["getZodSchema"]> }> {
    return {
        __type: "FieldDefinitionsFactory" as const,
        factory
    };
}

export interface FieldDefinitionsFactory<TFields extends z.ZodRawShape> {
    __type: "FieldDefinitionsFactory";
    factory: (fields: IFieldBuilderRegistry) => Record<string, FieldBuilder<any>>;
}

export type InferFieldSchema<T> =
    T extends FieldDefinitionsFactory<infer TFields> ? z.ZodObject<TFields> : never;
```

```ts
// PrivateCmsModelBuilder.ts
import { z } from "zod";
import {
    FieldDefinitionsBuilder,
    type FieldDefinitionsFactory
} from "./FieldDefinitionsBuilder.js";
import type { BaseModel } from "~/models/BaseModel.js";
import type { IModelData } from "~/models/abstractions.js";
import type { PrivateCmsModel, CmsModelMetadata, FieldBuilderConfig } from "./types.js";
// Import your existing ModelBuilder
import { ModelBuilder } from "~/models/ModelBuilder.js";
import { FieldBuilder } from "./FieldBuilder.js";
import { createImplementation } from "@webiny/di";
import {
    FieldBuilderRegistry,
    type IFieldBuilderRegistry,
    PrivateCmsModelBuilder as BuilderAbstraction
} from "~/cms/abstractions.js";

export interface IPrivateCmsModelBuilder {
    create<TModel extends BaseModel<any>, TFields extends z.ZodRawShape = any>(
        modelId: string,
        fieldDefinitions: FieldDefinitionsFactory<TFields>
    ): IPrivateCmsModelConfiguration<TModel>;
}

export interface IPrivateCmsModelConfiguration<TModel extends BaseModel<any>> {
    withMethods<TMethods extends object>(
        methods: TMethods & ThisType<TModel & TMethods>
    ): IPrivateCmsModelConfiguration<TModel>;
    extendFields(
        factory: (fields: IFieldBuilderRegistry) => Record<string, FieldBuilder<any>>
    ): IPrivateCmsModelConfiguration<TModel>;
    build(): PrivateCmsModel<TModel>;
}

class PrivateCmsModelBuilderImpl implements IPrivateCmsModelBuilder {
    constructor(private fieldBuilderRegistry: IFieldBuilderRegistry) {}

    create<TModel extends BaseModel<any>, TFields extends z.ZodRawShape = any>(
        modelId: string,
        fieldDefinitions: FieldDefinitionsFactory<TFields>
    ): IPrivateCmsModelConfiguration<TModel> {
        const builder = new FieldDefinitionsBuilder(this.fieldBuilderRegistry);
        const fieldShape = fieldDefinitions.factory(this.fieldBuilderRegistry);
        const fieldDefinitionsBuilder = builder.__fromObject(fieldShape);

        return new PrivateCmsModelConfiguration<TModel>(
            modelId,
            this.fieldBuilderRegistry,
            fieldDefinitionsBuilder
        );
    }
}

class PrivateCmsModelConfiguration<TModel extends BaseModel<any>>
    implements IPrivateCmsModelConfiguration<TModel>
{
    private metadata: CmsModelMetadata = {};
    private modelMethods: Record<string, Function> = {};
    private extensionFields = new Map<string, FieldBuilderConfig>();

    constructor(
        private modelId: string,
        private fieldBuilderRegistry: IFieldBuilderRegistry,
        private fieldDefinitionsBuilder: FieldDefinitionsBuilder
    ) {}

    withMethods<TMethods extends object>(
        methods: TMethods & ThisType<TModel & TMethods>
    ): IPrivateCmsModelConfiguration<TModel> {
        Object.assign(this.modelMethods, methods);
        return this as any;
    }

    extendFields(
        factory: (fields: IFieldBuilderRegistry) => Record<string, FieldBuilder<any>>
    ): IPrivateCmsModelConfiguration<TModel> {
        // Use the factory to get field shape - same as createFieldDefinitions!
        const fieldShape = factory(this.fieldBuilderRegistry);

        // Convert to field configs
        for (const [fieldId, fieldBuilder] of Object.entries(fieldShape)) {
            const config = fieldBuilder.toConfig();
            config.fieldId = fieldId;
            const zodSchema = fieldBuilder.getZodSchema();

            this.extensionFields.set(fieldId, {
                fieldId,
                config,
                zodSchema
            });
        }

        return this as any;
    }

    build(): PrivateCmsModel<TModel> {
        const baseSchema = this.fieldDefinitionsBuilder.__toZodSchema();
        let finalSchema = baseSchema;

        if (this.extensionFields.size > 0) {
            const extensionsShape: z.ZodRawShape = {};

            for (const [fieldId, { zodSchema }] of this.extensionFields) {
                // Make each extension field optional
                extensionsShape[fieldId] = zodSchema.optional();
            }

            const extensionsSchema = z.object(extensionsShape).optional();

            finalSchema = baseSchema.extend({
                extensions: extensionsSchema
            }) as any;
        }

        let modelBuilder = new ModelBuilder<any>(this.modelId, finalSchema);

        if (Object.keys(this.modelMethods).length > 0) {
            modelBuilder = modelBuilder.withMethods(this.modelMethods);
        }

        const ModelClass = modelBuilder.build();

        const allFields = [
            ...this.fieldDefinitionsBuilder.__getFields(),
            ...(this.extensionFields.size > 0
                ? [
                      {
                          fieldId: "extensions",
                          type: "object",
                          label: "Extensions",
                          validation: [],
                          settings: {},
                          zodSchema: z
                              .object(
                                  Object.fromEntries(
                                      Array.from(this.extensionFields.entries()).map(
                                          ([id, { zodSchema }]) => [id, zodSchema.optional()]
                                      )
                                  )
                              )
                              .optional(),
                          fields: Array.from(this.extensionFields.values()).map(f => f.config)
                      }
                  ]
                : [])
        ];

        return {
            type: "private" as const,
            modelType: "private" as const,
            Model: ModelClass as any,
            modelId: this.modelId,
            name: this.modelId,
            icon: this.metadata.icon,
            description: this.metadata.description,
            fields: allFields,
            schema: modelBuilder.getSchema() as TModel["__schema"],
            create: (data: IModelData<TModel>) => ModelClass.create(data) as TModel
        };
    }
}

export const PrivateCmsModelBuilder = createImplementation({
    abstraction: BuilderAbstraction,
    implementation: PrivateCmsModelBuilderImpl,
    dependencies: [FieldBuilderRegistry]
});
```

```ts
// PrivatePage/Page.fields.ts
import { createFieldDefinitions, type InferFieldSchema } from "~/cms/FieldDefinitionsBuilder.js";

export const PageFieldDefinitions = createFieldDefinitions(fields => ({
    id: fields.text().required(),
    title: fields.text().label("Title").required(),
    path: fields.text().label("Path").required(),
    content: fields.text().label("Content")
}));

export type PageFieldsSchema = InferFieldSchema<typeof PageFieldDefinitions>;
```

```ts
// PrivatePage/PageModelBuilder.ts
import { createImplementation } from "@webiny/di";
import { PageFieldDefinitions } from "./Page.fields.js";
import { PrivateCmsModelBuilder } from "~/cms/abstractions.js";
import {
    IPage,
    PageCmsModelBuilder as BuilderAbstraction
} from "~/cms/PrivatePage/abstractions.js";

class PageCmsModelBuilderImpl implements BuilderAbstraction.Interface {
    constructor(private privateCmsModelBuilder: PrivateCmsModelBuilder.Interface) {}

    async buildCmsModel() {
        return this.privateCmsModelBuilder.create<IPage>("page", PageFieldDefinitions).withMethods({
            getFullPath() {
                return this.path.startsWith("/") ? this.path : `/${this.path}`;
            }
        });
    }
}

export const PageCmsModelBuilder = createImplementation({
    abstraction: BuilderAbstraction,
    implementation: PageCmsModelBuilderImpl,
    dependencies: [PrivateCmsModelBuilder]
});
```

```ts
// PrivatePage/PageModelFactory.ts
import { createImplementation } from "@webiny/di";
import {
    PageModelFactory as FactoryAbstraction,
    PageCmsModelBuilder,
    type IPage
} from "./abstractions.js";
import type { ModelClass } from "~/models/ModelBuilder.js";
import type { PrivateCmsModel } from "~/cms/types.js";

class PageModelFactoryImpl implements FactoryAbstraction.Interface {
    private modelClass: ModelClass<IPage> | undefined;
    private cmsModel: PrivateCmsModel<IPage> | undefined;

    constructor(private cmsModelBuilder: PageCmsModelBuilder.Interface) {}

    async create(data: FactoryAbstraction.CreateInput): Promise<IPage> {
        if (this.modelClass) {
            return this.modelClass.create(data);
        }

        // Build the CMS model configuration
        const builder = await this.cmsModelBuilder.buildCmsModel();

        // Build the final model
        this.cmsModel = builder.build();
        this.modelClass = this.cmsModel.Model;

        return this.modelClass.create(data);
    }

    // Optional: expose the CMS model metadata
    getCmsModel(): PrivateCmsModel<IPage> | undefined {
        return this.cmsModel;
    }
}

export const PageModelFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: PageModelFactoryImpl,
    dependencies: [PageCmsModelBuilder]
});
```

```ts
// PrivatePage/__tests__/PageModelFactory.test.ts
import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { FieldBuilderRegistry } from "~/cms/FieldBuilderRegistry.js";
import { PrivateCmsModelBuilder } from "~/cms/PrivateCmsModelBuilder.js";
import { PageCmsModelBuilder } from "../PageModelBuilder.js";
import { PageModelFactory } from "../PageModelFactory.js";
import { PageModelFactory as FactoryAbstraction } from "../abstractions.js";
import { PageSeoDecorator } from "./PageSeoDecorator.js";
import { PagePublishingDecorator } from "./PagePublishingDecorator.js";

describe("PageModelFactory", () => {
    const createContainer = () => {
        const container = new Container();
        container.register(FieldBuilderRegistry);
        container.register(PrivateCmsModelBuilder);
        container.register(PageCmsModelBuilder);
        container.register(PageModelFactory);
        return container;
    };

    it("should create page instances", async () => {
        const container = createContainer();

        const factory = container.resolve(FactoryAbstraction);

        const page = await factory.create({
            id: "1",
            title: "Home Page",
            path: "home",
            content: "Welcome to our site"
        });

        expect(page.id).toBe("1");
        expect(page.title).toBe("Home Page");
        expect(page.path).toBe("home");
        expect(page.getFullPath()).toBe("/home");
    });

    it("should work with path that already has slash", async () => {
        const container = new Container();
        container.register(FieldBuilderRegistry);
        container.register(PrivateCmsModelBuilder);
        container.register(PageCmsModelBuilder);
        container.register(PageModelFactory);

        const factory = container.resolve(FactoryAbstraction);

        const page = await factory.create({
            id: "1",
            title: "About",
            path: "/about",
            content: "About us"
        });

        expect(page.getFullPath()).toBe("/about");
    });

    it("should cache model class and reuse it", async () => {
        const container = createContainer();

        const factory = container.resolve(FactoryAbstraction);

        const page1 = await factory.create({
            id: "1",
            title: "Page 1",
            path: "page-1",
            content: "Content 1"
        });

        const page2 = await factory.create({
            id: "2",
            title: "Page 2",
            path: "page-2",
            content: "Content 2"
        });

        // Both should be instances of the same class
        expect(page1.constructor).toBe(page2.constructor);
    });

    describe("With SEO Decorator", () => {
        it("should add SEO fields and methods", async () => {
            const container = createContainer();

            // Register SEO decorator
            container.registerDecorator(PageSeoDecorator);

            const factory = container.resolve(FactoryAbstraction);

            const page = await factory.create({
                id: "1",
                title: "Home",
                path: "home",
                content: "Content",
                extensions: {
                    seo: {
                        title: "Home - SEO Title",
                        description: "SEO Description",
                        keywords: "home, website"
                    }
                }
            });

            expect(page.getSeoTitle()).toBe("Home - SEO Title");
            expect(page.hasSeo()).toBe(true);
        });

        it("should fall back to title when no SEO title", async () => {
            const container = createContainer();

            container.registerDecorator(PageSeoDecorator);

            const factory = container.resolve(FactoryAbstraction);

            const page = await factory.create({
                id: "1",
                title: "Home",
                path: "home",
                content: "Content"
            });

            expect(page.getSeoTitle()).toBe("Home");
            expect(page.hasSeo()).toBe(false);
        });
    });

    describe("With Publishing Decorator", () => {
        it("should add publishing fields and methods", async () => {
            const container = createContainer();

            container.registerDecorator(PagePublishingDecorator);

            const factory = container.resolve(FactoryAbstraction);

            const page = await factory.create({
                id: "1",
                title: "Home",
                path: "home",
                content: "Content"
            });

            expect(page.isDraft()).toBe(true);
            expect(page.isPublished()).toBe(false);

            page.publish("user-123");

            expect(page.isDraft()).toBe(false);
            expect(page.isPublished()).toBe(true);
            expect(page.extensions?.publishedBy).toBe("user-123");
            expect(page.extensions?.publishedAt).toBeDefined();
        });

        it("should unpublish page", async () => {
            const container = createContainer();

            container.registerDecorator(PagePublishingDecorator);

            const factory = container.resolve(FactoryAbstraction);

            const page = await factory.create({
                id: "1",
                title: "Home",
                path: "home",
                content: "Content",
                extensions: {
                    status: "published",
                    publishedAt: "2024-01-01",
                    publishedBy: "user-123"
                }
            });

            expect(page.isPublished()).toBe(true);

            page.unpublish();

            expect(page.isDraft()).toBe(true);
            expect(page.isPublished()).toBe(false);
        });
    });

    describe("With Multiple Decorators", () => {
        it("should combine SEO and Publishing decorators", async () => {
            const container = createContainer();

            // Register both decorators
            container.registerDecorator(PageSeoDecorator);
            container.registerDecorator(PagePublishingDecorator);

            const factory = container.resolve(FactoryAbstraction);

            const page = await factory.create({
                id: "1",
                title: "Home",
                path: "home",
                content: "Content",
                extensions: {
                    seo: {
                        title: "Home SEO",
                        description: "Description",
                        keywords: "keywords"
                    }
                }
            });

            // Base methods work
            expect(page.getFullPath()).toBe("/home");

            // SEO methods work
            expect(page.getSeoTitle()).toBe("Home SEO");
            expect(page.hasSeo()).toBe(true);

            // Publishing methods work
            expect(page.isDraft()).toBe(true);
            page.publish("user-456");
            expect(page.isPublished()).toBe(true);
            expect(page.extensions?.publishedBy).toBe("user-456");
        });
    });

    describe("Model Operations", () => {
        it("should support clone()", async () => {
            const container = createContainer();

            const factory = container.resolve(FactoryAbstraction);

            const original = await factory.create({
                id: "1",
                title: "Original",
                path: "original",
                content: "Content"
            });

            const cloned = original.clone();

            expect(cloned).not.toBe(original);
            expect(cloned.id).toBe(original.id);
            expect(cloned.title).toBe(original.title);

            cloned.title = "Modified";
            expect(original.title).toBe("Original");
            expect(cloned.title).toBe("Modified");
        });

        it("should support updateWith()", async () => {
            const container = createContainer();

            const factory = container.resolve(FactoryAbstraction);

            const page = await factory.create({
                id: "1",
                title: "Original",
                path: "original",
                content: "Content"
            });

            page.updateWith({
                title: "Updated",
                content: "New Content"
            });

            expect(page.id).toBe("1");
            expect(page.title).toBe("Updated");
            expect(page.path).toBe("original");
            expect(page.content).toBe("New Content");
        });
    });
});
```

```ts
// PrivatePage/__tests__/PagePublishingDecorator.ts
import { createDecorator } from "@webiny/di";
import { PageCmsModelBuilder } from "~/cms/PrivatePage/abstractions.js";

class PagePublishingDecoratorImpl implements PageCmsModelBuilder.Interface {
    constructor(private decoratee: PageCmsModelBuilder.Interface) {}

    async buildCmsModel() {
        const builder = await this.decoratee.buildCmsModel();

        return builder
            .extendFields(fields => ({
                publishedAt: fields.text().label("Published At"),
                publishedBy: fields.text().label("Published By"),
                status: fields.text().label("Status")
            }))
            .withMethods({
                publish(userId: string) {
                    if (!this.extensions) {
                        this.extensions = {};
                    }
                    this.extensions.publishedAt = new Date().toISOString();
                    this.extensions.publishedBy = userId;
                    this.extensions.status = "published";
                },
                unpublish() {
                    if (!this.extensions) {
                        this.extensions = {};
                    }
                    this.extensions.status = "draft";
                },
                isPublished() {
                    return this.extensions?.status === "published";
                },
                isDraft() {
                    return !this.extensions?.status || this.extensions.status === "draft";
                }
            });
    }
}

export const PagePublishingDecorator = createDecorator({
    abstraction: PageCmsModelBuilder,
    decorator: PagePublishingDecoratorImpl,
    dependencies: []
});

declare module "~/cms/PrivatePage/abstractions.js" {
    interface IPage {
        publish(userId: string): void;
        unpublish(): void;
        isPublished(): boolean;
        isDraft(): boolean;
    }

    interface IPageExtensions {
        publishedAt?: string;
        publishedBy?: string;
        status?: "draft" | "published" | "archived";
    }
}
```

```ts
// PrivatePage/__tests__/PageSeoDecorator.ts
import { createDecorator } from "@webiny/di";
import { PageCmsModelBuilder } from "~/cms/PrivatePage/abstractions.js";

class PageSeoDecoratorImpl implements PageCmsModelBuilder.Interface {
    constructor(private decoratee: PageCmsModelBuilder.Interface) {}

    async buildCmsModel() {
        const builder = await this.decoratee.buildCmsModel();

        return builder
            .extendFields(fields => ({
                seo: fields
                    .object(reg => ({
                        title: reg.text().label("SEO Title"),
                        description: reg.text().label("SEO Description"),
                        keywords: reg.text().label("Keywords")
                    }))
                    .label("SEO Settings")
            }))
            .withMethods({
                getSeoTitle() {
                    return this.extensions?.seo?.title || this.title;
                },
                hasSeo() {
                    return !!this.extensions?.seo?.title;
                }
            });
    }
}

export const PageSeoDecorator = createDecorator({
    abstraction: PageCmsModelBuilder,
    decorator: PageSeoDecoratorImpl,
    dependencies: []
});

// Module augmentation
declare module "~/cms/PrivatePage/abstractions.js" {
    interface IPage {
        getSeoTitle(): string;
        hasSeo(): boolean;
    }

    interface IPageExtensions {
        seo?: {
            title: string;
            description: string;
            keywords: string;
        };
    }
}
```

```ts
// PrivatePage/abstractions.ts
import { Abstraction } from "@webiny/di";
import type { IModel, IModelData } from "~/models/abstractions.js";
import type { ICmsModelBuilder, ICmsModelFactory } from "~/cms/abstractions.js";
import type { PageFieldsSchema } from "./Page.fields.js";

// Extension interface for plugins to augment
export interface IPageExtensions {}

// Page model interface
export interface IPage extends IModel<PageFieldsSchema> {
    getFullPath(): string;
    extensions?: IPageExtensions;
}

// Page-specific model builder abstraction
export const PageCmsModelBuilder = new Abstraction<ICmsModelBuilder<IPage>>("PageCmsModelBuilder");

export namespace PageCmsModelBuilder {
    export type Interface = ICmsModelBuilder<IPage>;
}

// Page-specific model factory abstraction
export const PageModelFactory = new Abstraction<ICmsModelFactory<IPage>>("PageModelFactory");

export namespace PageModelFactory {
    export type Interface = ICmsModelFactory<IPage>;
    export type CreateInput = IModelData<IPage>;
}
```

```ts
// __tests__/PrivateCmsModelBuilder.test.ts
import { describe, it, expect } from "vitest";
import { PrivateCmsModelBuilder } from "../PrivateCmsModelBuilder.js";
import { FieldBuilderRegistry } from "../FieldBuilderRegistry.js";
import { createFieldDefinitions, type InferFieldSchema } from "../FieldDefinitionsBuilder.js";
import type { IModel } from "~/models/abstractions.js";

describe("PrivateCmsModelBuilder", () => {
    const registry = new FieldBuilderRegistry();
    const builder = new PrivateCmsModelBuilder(registry);

    describe("Basic Model Creation", () => {
        it("should create a basic model with text fields", () => {
            // ✅ Object syntax!
            const fieldDefs = createFieldDefinitions(fields => ({
                id: fields.text().required(),
                title: fields.text().label("Title").required()
            }));

            type Schema = InferFieldSchema<typeof fieldDefs>;
            interface ITestModel extends IModel<Schema> {}

            const model = builder.create<ITestModel>("test", fieldDefs).build();

            expect(model.modelId).toBe("test");
            expect(model.fields).toHaveLength(2);
            expect(model.fields[0].fieldId).toBe("id");
            expect(model.fields[1].fieldId).toBe("title");
        });

        it("should properly infer types", () => {
            const fieldDefs = createFieldDefinitions(fields => ({
                id: fields.text().required(),
                name: fields.text().label("Name").required(),
                email: fields.text().email().required()
            }));

            type Schema = InferFieldSchema<typeof fieldDefs>;
            interface ITestModel extends IModel<Schema> {}

            const model = builder.create<ITestModel>("test", fieldDefs).build();

            // ✅ Fully typed!
            const instance = model.create({
                id: "1",
                name: "John Doe",
                email: "john@example.com"
            });

            expect(instance.id).toBe("1");
            expect(instance.name).toBe("John Doe");
            expect(instance.email).toBe("john@example.com");
        });
    });

    describe("Object Fields", () => {
        it("should support nested object fields", () => {
            const fieldDefs = createFieldDefinitions(fields => ({
                id: fields.text().required(),
                author: fields
                    .object(reg => ({
                        name: reg.text().required(),
                        email: reg.text().email().required()
                    }))
                    .label("Author")
            }));

            type Schema = InferFieldSchema<typeof fieldDefs>;
            interface ITestModel extends IModel<Schema> {}

            const model = builder.create<ITestModel>("test", fieldDefs).build();

            const instance = model.create({
                id: "1",
                author: {
                    name: "John Doe",
                    email: "john@example.com"
                }
            });

            expect(instance.author.name).toBe("John Doe");
            expect(instance.author.email).toBe("john@example.com");
        });
    });

    describe("Field Extensions", () => {
        it("should add extension fields under extensions property", () => {
            const fieldDefs = createFieldDefinitions(fields => ({
                id: fields.text().required(),
                title: fields.text().required()
            }));

            type Schema = InferFieldSchema<typeof fieldDefs>;
            interface ITestModel extends IModel<Schema> {
                extensions?: {
                    seo?: {
                        title: string;
                        description: string;
                    };
                };
            }

            // ✅ Same object syntax as createFieldDefinitions!
            const model = builder
                .create<ITestModel>("test", fieldDefs)
                .extendFields(fields => ({
                    seo: fields
                        .object(reg => ({
                            title: reg.text().label("SEO Title"),
                            description: reg.text().label("SEO Description")
                        }))
                        .label("SEO Settings")
                }))
                .build();

            expect(model.fields).toHaveLength(3);
        });

        it("should support multiple extension fields", () => {
            const fieldDefs = createFieldDefinitions(fields => ({
                id: fields.text().required(),
                title: fields.text().required()
            }));

            type Schema = InferFieldSchema<typeof fieldDefs>;
            interface ITestModel extends IModel<Schema> {
                extensions?: {
                    seo?: { title: string };
                    published?: string;
                };
            }

            // ✅ Clean object syntax!
            const model = builder
                .create<ITestModel>("test", fieldDefs)
                .extendFields(fields => ({
                    seo: fields.object(reg => ({
                        title: reg.text()
                    })),
                    published: fields.text()
                }))
                .build();

            const instance = model.create({
                id: "1",
                title: "Test",
                extensions: {
                    seo: { title: "SEO" },
                    published: "2024-01-01"
                }
            });

            expect(instance.extensions?.seo?.title).toBe("SEO");
            expect(instance.extensions?.published).toBe("2024-01-01");
        });

        it("should chain multiple extendFields calls", () => {
            const fieldDefs = createFieldDefinitions(fields => ({
                id: fields.text().required(),
                title: fields.text().required()
            }));

            type Schema = InferFieldSchema<typeof fieldDefs>;
            interface ITestModel extends IModel<Schema> {
                extensions?: {
                    seo?: { title: string };
                    analytics?: { tracking: string };
                };
            }

            // ✅ Can chain multiple calls!
            const model = builder
                .create<ITestModel>("test", fieldDefs)
                .extendFields(fields => ({
                    seo: fields.object(reg => ({
                        title: reg.text()
                    }))
                }))
                .extendFields(fields => ({
                    analytics: fields.object(reg => ({
                        tracking: reg.text()
                    }))
                }))
                .build();

            const instance = model.create({
                id: "1",
                title: "Test",
                extensions: {
                    seo: { title: "SEO" },
                    analytics: { tracking: "GA-123" }
                }
            });

            expect(instance.extensions?.seo?.title).toBe("SEO");
            expect(instance.extensions?.analytics?.tracking).toBe("GA-123");
        });
    });

    describe("Decorator Pattern", () => {
        it("should work with decorator pattern", () => {
            const PageFieldDefinitions = createFieldDefinitions(fields => ({
                id: fields.text().required(),
                title: fields.text().label("Title").required(),
                path: fields.text().label("Path").slug().required()
            }));

            type PageFieldsSchema = InferFieldSchema<typeof PageFieldDefinitions>;

            interface IPageExtensions {
                seo?: { title: string; description: string };
                publishedAt?: string;
                publishedBy?: string;
            }

            interface IPage extends IModel<PageFieldsSchema> {
                getFullPath(): string;
                getSeoTitle(): string;
                publish(userId: string): void;
                isPublished(): boolean;
                extensions?: IPageExtensions;
            }

            const baseBuilder = builder.create<IPage>("page", PageFieldDefinitions).withMethods({
                getFullPath() {
                    return this.path.startsWith("/") ? this.path : `/${this.path}`;
                }
            });

            // ✅ Clean object syntax in decorators!
            const withSeo = baseBuilder
                .extendFields(fields => ({
                    seo: fields.object(reg => ({
                        title: reg.text(),
                        description: reg.text()
                    }))
                }))
                .withMethods({
                    getSeoTitle() {
                        return this.extensions?.seo?.title || this.title;
                    }
                });

            // ✅ Clean object syntax for publishing!
            const withPublishing = withSeo
                .extendFields(fields => ({
                    publishedAt: fields.text(),
                    publishedBy: fields.text()
                }))
                .withMethods({
                    publish(userId: string) {
                        if (!this.extensions) {
                            this.extensions = {};
                        }
                        this.extensions.publishedAt = new Date().toISOString();
                        this.extensions.publishedBy = userId;
                    },
                    isPublished() {
                        return !!this.extensions?.publishedAt;
                    }
                });

            const model = withPublishing.build();

            const page = model.create({
                id: "1",
                title: "Home",
                path: "home",
                extensions: {
                    seo: { title: "Home SEO", description: "Home Description" }
                }
            });

            expect(page.getFullPath()).toBe("/home");
            expect(page.getSeoTitle()).toBe("Home SEO");
            expect(page.isPublished()).toBe(false);

            page.publish("user-123");
            expect(page.isPublished()).toBe(true);
            expect(page.extensions?.publishedBy).toBe("user-123");
        });
    });
});
```

```ts
// abstractions.ts
import { z } from "zod";
import { Abstraction } from "@webiny/di";
import type { BaseModel } from "~/models/BaseModel.js";
import type { IModelData } from "~/models/abstractions.js";
import type { IPrivateCmsModelConfiguration } from "./PrivateCmsModelBuilder.js";
import type { FieldDefinitionsFactory } from "./FieldDefinitionsBuilder.js";
import { type TextFieldBuilder, type ObjectFieldBuilder, FieldBuilder } from "./FieldBuilder.js";

/**
 * Field Builder Registry - provides field builders
 */
export interface IFieldBuilderRegistry {
    text(): TextFieldBuilder<z.ZodString>;
    object<TShape extends z.ZodRawShape>(
        fields: (registry: IFieldBuilderRegistry) => {
            [K in keyof TShape]: FieldBuilder<TShape[K]>;
        }
    ): ObjectFieldBuilder<TShape>;
}

export const FieldBuilderRegistry = new Abstraction<IFieldBuilderRegistry>("FieldBuilderRegistry");

/**
 * Private CMS Model Builder - builds CMS model configurations
 */
export interface IPrivateCmsModelBuilder {
    create<TModel extends BaseModel<any>>(
        modelId: string,
        fieldDefinitions: FieldDefinitionsFactory<any>
    ): IPrivateCmsModelConfiguration<TModel>;
}

export const PrivateCmsModelBuilder = new Abstraction<IPrivateCmsModelBuilder>(
    "PrivateCmsModelBuilder"
);

export namespace PrivateCmsModelBuilder {
    export type Interface = IPrivateCmsModelBuilder;
}

/**
 * CMS Model Builder - builds the model configuration for a specific model
 */
export interface ICmsModelBuilder<TModel extends BaseModel<any>> {
    buildCmsModel(): Promise<IPrivateCmsModelConfiguration<TModel>>;
}

/**
 * CMS Model Factory - creates model instances
 */
export interface ICmsModelFactory<TModel extends BaseModel<any>> {
    create(data: IModelData<TModel>): Promise<TModel>;
}
```

```ts
// types.ts
import { z } from "zod";
import type { ModelClass } from "~/models/ModelBuilder.js";
import type { BaseModel } from "~/models/BaseModel.js";
import type { IModelData } from "~/models/abstractions.js";

export interface FieldConfig {
    fieldId: string;
    type: string;
    label?: string;
    helpText?: string;
    placeholderText?: string;
    validation?: ValidationRule[];
    settings?: Record<string, any>;
    zodSchema: z.ZodTypeAny;
    fields?: FieldConfig[]; // For nested object fields
}

export interface ValidationRule {
    name: string;
    message: string;
    settings: Record<string, any>;
}

export interface CmsModelMetadata {
    icon?: string;
    description?: string;
    titleFieldId?: string;
    descriptionFieldId?: string;
    imageFieldId?: string;
    tags?: string[];
}

// Make PrivateCmsModel generic!
export interface PrivateCmsModel<TModel extends BaseModel<any>> {
    type: "private";
    modelType: "private";
    Model: ModelClass<TModel>;
    modelId: string;
    name: string;
    icon?: string;
    description?: string;
    fields: FieldConfig[];
    schema: TModel["__schema"];
    create: (data: IModelData<TModel>) => TModel;
}

export interface FieldBuilderConfig {
    fieldId: string;
    config: FieldConfig;
    zodSchema: z.ZodTypeAny;
}
```
