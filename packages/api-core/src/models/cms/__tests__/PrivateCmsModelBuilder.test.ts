import { describe, it, expect } from "vitest";
import { PrivateCmsModelBuilder } from "../PrivateCmsModelBuilder.js";
import { FieldBuilderRegistry } from "../FieldBuilderRegistry.js";
import { createFieldDefinitions, type InferFieldSchema } from "../FieldDefinitionsBuilder.js";
import type { IModel } from "~/models/base/abstractions.js";

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
