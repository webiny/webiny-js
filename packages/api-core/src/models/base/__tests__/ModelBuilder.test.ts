import { describe, it, expect } from "vitest";
import { createModelSchema, ModelBuilder } from "../ModelBuilder.js";
import type { IModel } from "../abstractions.js";

describe("ModelBuilder", () => {
    describe("Basic functionality", () => {
        it("should create a model class from schema", () => {
            const schema = createModelSchema(z => ({
                id: z.string(),
                name: z.string()
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema);
            const Model = builder.build();

            const instance = new Model({ id: "1", name: "Test" });

            expect(instance.id).toBe("1");
            expect(instance.name).toBe("Test");
        });

        it("should expose schema as static property", () => {
            const schema = createModelSchema(z => ({
                id: z.string(),
                name: z.string()
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema);
            const Model = builder.build();

            expect(Model.__schema).toBeDefined();
        });

        it("should validate data on construction", () => {
            const schema = createModelSchema(z => ({
                id: z.string(),
                age: z.number()
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema);
            const Model = builder.build();

            expect(() => {
                new Model({ id: "1", age: "not a number" } as any);
            }).toThrow("Validation error");
        });

        it("should throw on missing required fields", () => {
            const schema = createModelSchema(z => ({
                id: z.string(),
                required: z.string()
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema);
            const Model = builder.build();

            expect(() => {
                new Model({ id: "1" } as any);
            }).toThrow("Validation error");
        });
    });

    describe("withMethods", () => {
        it("should add methods to model", () => {
            const schema = createModelSchema(z => ({
                id: z.string(),
                active: z.boolean()
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema).withMethods({
                isActive() {
                    return this.active;
                },
                activate() {
                    this.active = true;
                }
            });

            const Model = builder.build();
            const instance = new Model({ id: "1", active: false });

            expect(instance.isActive()).toBe(false);
            instance.activate();
            expect(instance.isActive()).toBe(true);
        });

        it("should chain multiple withMethods calls", () => {
            const schema = createModelSchema(z => ({
                count: z.number()
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema)
                .withMethods({
                    increment() {
                        this.count++;
                    }
                })
                .withMethods({
                    decrement() {
                        this.count--;
                    }
                });

            const Model = builder.build();
            const instance = new Model({ count: 5 });

            instance.increment();
            expect(instance.count).toBe(6);
            instance.decrement();
            expect(instance.count).toBe(5);
        });

        it("should have access to all properties in methods", () => {
            const schema = createModelSchema(z => ({
                firstName: z.string(),
                lastName: z.string()
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema).withMethods({
                getFullName() {
                    return `${this.firstName} ${this.lastName}`;
                }
            });

            const Model = builder.build();
            const instance = new Model({ firstName: "John", lastName: "Doe" });

            expect(instance.getFullName()).toBe("John Doe");
        });
    });

    describe("extendSchema", () => {
        it("should extend schema with new fields in extensions", () => {
            const baseSchema = createModelSchema(z => ({
                id: z.string()
            }));

            const builder = new ModelBuilder<IModel<typeof baseSchema>>(
                "Model",
                baseSchema
            ).extendSchema(z => ({
                name: z.string(),
                age: z.number()
            }));

            const Model = builder.build();

            const instance = new Model({
                id: "1",
                // @ts-expect-error In a real environment, you'll never have everything in one file, so interface will be augmented.
                extensions: {
                    name: "Test",
                    age: 25
                }
            });

            expect(instance.id).toBe("1");
            // @ts-expect-error
            expect(instance.extensions.name).toBe("Test");
            // @ts-expect-error
            expect(instance.extensions.age).toBe(25);
        });

        it("should validate extended fields", () => {
            const baseSchema = createModelSchema(z => ({
                id: z.string()
            }));

            const builder = new ModelBuilder<IModel<typeof baseSchema>>(
                "Model",
                baseSchema
            ).extendSchema(z => ({
                email: z.string().email()
            }));

            const Model = builder.build();

            expect(() => {
                // @ts-expect-error
                new Model({ id: "1", extensions: { email: "invalid-email" } });
            }).toThrow("Validation error");

            const valid = new Model({
                id: "1",
                // @ts-expect-error
                extensions: { email: "test@example.com" }
            });
            // @ts-expect-error
            expect(valid.extensions.email).toBe("test@example.com");
        });

        it("should chain extendSchema calls", () => {
            const baseSchema = createModelSchema(z => ({
                id: z.string()
            }));

            const builder = new ModelBuilder<IModel<typeof baseSchema>>("Model", baseSchema)
                .extendSchema(z => ({ name: z.string() }))
                .extendSchema(z => ({ age: z.number() }));

            const Model = builder.build();
            const instance = new Model({
                id: "1",
                // @ts-expect-error In a real environment, you'll never have everything in one file, so interface will be augmented.
                extensions: { name: "Test", age: 30 }
            });

            expect(instance.id).toBe("1");
            // @ts-expect-error
            expect(instance.extensions.name).toBe("Test");
            // @ts-expect-error
            expect(instance.extensions.age).toBe(30);
        });

        it("should preserve methods when extending schema", () => {
            const baseSchema = createModelSchema(z => ({
                count: z.number()
            }));

            const builder = new ModelBuilder<IModel<typeof baseSchema>>("Model", baseSchema)
                .withMethods({
                    increment() {
                        this.count++;
                    }
                })
                .extendSchema(z => ({
                    name: z.string()
                }));

            const Model = builder.build();
            const instance = new Model({
                count: 5,
                // @ts-expect-error
                extensions: { name: "Counter" }
            });

            instance.increment();
            expect(instance.count).toBe(6);
            // @ts-expect-error
            expect(instance.extensions.name).toBe("Counter");
        });
    });

    describe("clone", () => {
        it("should create a copy of the instance", () => {
            const schema = createModelSchema(z => ({
                id: z.string(),
                name: z.string()
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema);
            const Model = builder.build();

            const original = new Model({ id: "1", name: "Original" });
            const cloned = original.clone();

            expect(cloned).not.toBe(original);
            expect(cloned.id).toBe(original.id);
            expect(cloned.name).toBe(original.name);
        });

        it("should clone with methods intact", () => {
            const schema = createModelSchema(z => ({
                count: z.number()
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema).withMethods({
                increment() {
                    this.count++;
                }
            });

            const Model = builder.build();
            const original = new Model({ count: 5 });
            const cloned = original.clone();

            cloned.increment();

            expect(original.count).toBe(5);
            expect(cloned.count).toBe(6);
        });

        it("should preserve extended properties in clone", () => {
            const schema = createModelSchema(z => ({
                id: z.string()
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema).extendSchema(
                z => ({
                    metadata: z.object({ key: z.string() }).optional()
                })
            );

            const Model = builder.build();
            const original = new Model({
                id: "1",
                // @ts-expect-error
                extensions: { metadata: { key: "value" } }
            });
            const cloned = original.clone();

            // @ts-expect-error
            expect(cloned.extensions.metadata).toEqual({ key: "value" });
        });
    });

    describe("updateWith", () => {
        it("should update properties", () => {
            const schema = createModelSchema(z => ({
                id: z.string(),
                name: z.string(),
                age: z.number()
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema);
            const Model = builder.build();

            const instance = Model.create({ id: "1", name: "John", age: 25 });
            instance.updateWith({ name: "Jane", age: 30 });

            expect(instance.id).toBe("1");
            expect(instance.name).toBe("Jane");
            expect(instance.age).toBe(30);
        });

        it("should validate updated data", () => {
            const schema = createModelSchema(z => ({
                id: z.string(),
                email: z.string().email()
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema);
            const Model = builder.build();

            const instance = new Model({ id: "1", email: "valid@example.com" });

            expect(() => {
                instance.updateWith({ email: "invalid-email" });
            }).toThrow("Validation error");

            expect(instance.email).toBe("valid@example.com");
        });

        it("should allow partial updates", () => {
            const schema = createModelSchema(z => ({
                id: z.string(),
                name: z.string(),
                age: z.number()
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema);
            const Model = builder.build();

            const instance = new Model({ id: "1", name: "John", age: 25 });
            instance.updateWith({ age: 26 });

            expect(instance.id).toBe("1");
            expect(instance.name).toBe("John");
            expect(instance.age).toBe(26);
        });
    });

    describe("Complex composition", () => {
        it("should handle full extension chain", () => {
            const baseSchema = createModelSchema(z => ({
                id: z.string(),
                title: z.string()
            }));

            const builder = new ModelBuilder<IModel<typeof baseSchema>>("Model", baseSchema)
                .withMethods({
                    getTitle() {
                        return this.title;
                    }
                })
                .extendSchema(z => ({
                    publishedAt: z.date().nullable()
                }))
                .withMethods({
                    publish() {
                        // @ts-expect-error
                        this.extensions.publishedAt = new Date();
                    },
                    isPublished() {
                        // @ts-expect-error
                        return this.extensions.publishedAt !== null;
                    }
                })
                .extendSchema(z => ({
                    metadata: z
                        .object({
                            seo: z.string().optional()
                        })
                        .optional()
                }))
                .withMethods({
                    hasSeo() {
                        // @ts-expect-error
                        return !!this.extensions.metadata?.seo;
                    }
                });

            const Model = builder.build();
            const instance = new Model({
                id: "1",
                title: "Test Post",
                // @ts-expect-error In a real environment, you'll never have everything in one file, so interface will be augmented.
                extensions: {
                    publishedAt: null,
                    metadata: { seo: "SEO Title" }
                }
            });

            instance.title = "Test Post";

            expect(instance.getTitle()).toBe("Test Post");
            expect(instance.isPublished()).toBe(false);
            expect(instance.hasSeo()).toBe(true);

            instance.publish();
            expect(instance.isPublished()).toBe(true);
        });

        it("should support nested object schemas", () => {
            const schema = createModelSchema(z => ({
                id: z.string(),
                author: z.object({
                    name: z.string(),
                    email: z.string()
                })
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema).withMethods({
                getAuthorName() {
                    return this.author.name;
                }
            });

            const Model = builder.build();
            const instance = new Model({
                id: "1",
                author: { name: "John", email: "john@example.com" }
            });

            expect(instance.getAuthorName()).toBe("John");
        });

        it("should support array fields in schema", () => {
            const schema = createModelSchema(z => ({
                id: z.string(),
                tags: z.array(z.string())
            }));

            const builder = new ModelBuilder<IModel<typeof schema>>("Model", schema).withMethods({
                hasTag(tag: string) {
                    return this.tags.includes(tag);
                },
                addTag(tag: string) {
                    if (!this.tags.includes(tag)) {
                        this.tags.push(tag);
                    }
                }
            });

            const Model = builder.build();
            const instance = new Model({ id: "1", tags: ["typescript", "testing"] });

            expect(instance.hasTag("typescript")).toBe(true);
            expect(instance.hasTag("javascript")).toBe(false);

            instance.addTag("javascript");
            expect(instance.hasTag("javascript")).toBe(true);
        });
    });

    describe("getSchema", () => {
        it("should return the current schema", () => {
            const baseSchema = createModelSchema(z => ({
                id: z.string()
            }));

            const builder = new ModelBuilder<IModel<typeof baseSchema>>("Model", baseSchema);
            expect(builder.getSchema()).toBeDefined();
        });

        it("should return extended schema after extendSchema", () => {
            const baseSchema = createModelSchema(z => ({
                id: z.string()
            }));

            const extendedBuilder = new ModelBuilder<IModel<typeof baseSchema>>(
                "Model",
                baseSchema
            ).extendSchema(z => ({
                name: z.string()
            }));

            const schema = extendedBuilder.getSchema();
            const result = schema.safeParse({
                id: "1",
                extensions: { name: "Test" }
            });

            expect(result.success).toBe(true);
        });
    });
});
