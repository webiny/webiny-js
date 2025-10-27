```ts
// BaseModel.ts
import { WebinyError } from "@webiny/error";
import z from "zod";
import { Result } from "./Result";

type DataProperties<T> = Omit<T, "__schema">;

export type IModelData<T> = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    [K in keyof DataProperties<T> as T[K] extends Function ? never : K]: T[K];
};

export type IModelInput<T> = IModelData<T>;

export abstract class BaseModel<TModel extends z.ZodObject<any> = any> {
    get __schema(): TModel {
        throw new Error("Schema getter is not implemented!");
    }

    constructor(data: IModelData<TModel>) {
        this.validateData(data);
        this.populate(data);
    }

    populate(data: IModelData<TModel>): void {
        Object.assign(this, data);
    }

    validate(): Result<true, WebinyError> {
        try {
            this.validateData(this.toData());
            return Result.ok(true);
        } catch (error) {
            return Result.fail(error);
        }
    }

    validateOrThrow(): void {
        this.validateData(this.toData());
    }

    clone(): this {
        const Constructor = this.constructor as new (data: IModelData<TModel>) => this;
        return new Constructor(this.toData());
    }

    toData(): IModelData<TModel> {
        if (this.__schema && this.__schema._def?.typeName === "ZodObject") {
            const result = {} as IModelData<TModel>;
            const shape = this.__schema.shape;
            for (const key in shape) {
                // always use structuredClone for safety.
                // @ts-expect-error allow index.
                result[key] = structuredClone(this[key]);
            }
            return result;
        }

        return { ...(this as any) } as IModelData<TModel>;
    }

    updateWith(partial: Partial<IModelData<this>>): void {
        const updated = { ...this.toData(), ...partial };
        this.validateData(updated);
        this.populate(updated);
    }

    protected validateData(data: IModelData<TModel>): void {
        const result = this.__schema.safeParse(data);
        if (!result.success) {
            throw new WebinyError({
                message: "Validation error",
                code: "DOMAIN_MODEL_VALIDATION_ERROR",
                data: result.error.errors
            });
        }
    }
}
```

```ts
// ModelBuilder.ts
import { z } from "zod";
import { BaseModel, type IModelData as ExtractModelData } from "./BaseModel.js";

export type ModelClass<TModel extends BaseModel<any>> = {
    __schema: TModel["__schema"];
    new (data: ExtractModelData<TModel>): TModel;
    create(data: ExtractModelData<TModel>): TModel;
};

export const createModelSchema = <TReturn extends z.ZodRawShape>(
    factory: (zod: typeof z) => TReturn
) => {
    return z.object({ ...factory(z) });
};

export class ModelBuilder<TModel extends BaseModel<any>> {
    private methods: Partial<Record<keyof TModel, any>> = {};

    constructor(
        private name: string,
        private schema: TModel["__schema"]
    ) {
        this.methods = {};
    }

    extendSchema<TExt extends z.ZodRawShape>(extensionFn: (zod: typeof z) => TExt): this {
        const shape = extensionFn(z);
        const baseExtensions = (this.schema.shape as any).extensions;

        let baseExtensionsObject: z.ZodObject<any>;
        if (baseExtensions instanceof z.ZodObject) {
            baseExtensionsObject = baseExtensions;
        } else if (baseExtensions) {
            let inner = baseExtensions as any;
            while (
                inner &&
                "_def" in inner &&
                ["ZodOptional", "ZodNullable", "ZodDefault"].includes(inner._def.typeName)
            ) {
                inner = inner._def.innerType;
            }
            baseExtensionsObject = inner instanceof z.ZodObject ? inner : z.object({});
        } else {
            baseExtensionsObject = z.object({});
        }

        const newExtensions = baseExtensionsObject.extend(shape);
        this.schema = this.schema.extend({
            extensions: newExtensions
        }) as TModel["__schema"];

        return this;
    }

    withMethods<TExtMethods extends object>(
        methods: TExtMethods & ThisType<TModel & TExtMethods>
    ): ModelBuilder<TModel & TExtMethods> {
        Object.assign(this.methods, methods);
        return this as unknown as ModelBuilder<TModel & TExtMethods>;
    }

    getSchema() {
        return this.schema;
    }

    build(): ModelClass<TModel> {
        const schema = this.schema;
        const methods = this.methods;
        const name = this.name;

        type ModelData = ExtractModelData<TModel>;

        class Model extends BaseModel<TModel["__schema"]> {
            public override get __schema() {
                return schema;
            }

            static __schema = schema;

            static create(data: ModelData) {
                return new this(data) as unknown as TModel;
            }

            override clone(): this {
                const Constructor = this.constructor as new (data: ModelData) => this;
                return new Constructor(this.toData());
            }
        }

        Object.assign(Model.prototype, methods);

        Object.defineProperty(Model.prototype, Symbol.toStringTag, {
            value: name
        });

        return Model as unknown as ModelClass<TModel>;
    }
}
```

```ts
// ModelFactory.ts

```

```ts
// Result.ts
/**
 * A container type that represents either a successful result (`ok`) or a failure (`fail`).
 * Inspired by functional programming constructs like `Either` or `Result` in other languages.
 *
 * @template TValue - The type of the success value.
 * @template TError - The type of the error value.
 */
export class Result<TValue, TError = never> {
    protected readonly _isOk: boolean;
    protected readonly _value?: TValue;
    protected readonly _error?: TError;

    private constructor(isOk: boolean, value?: TValue, error?: TError) {
        this._isOk = isOk;
        this._value = value;
        this._error = error;
    }

    /**
     * Creates a successful `Result` containing the provided value.
     *
     * @param value - The value to wrap in a successful result.
     * @returns A `Result` instance with the value.
     */
    public static ok<T>(value?: T): Result<T, never> {
        return new Result<T, never>(true, value);
    }

    /**
     * Creates a failed `Result` containing the provided error.
     *
     * @param error - The error to wrap in a failed result.
     * @returns A `Result` instance with the error.
     */
    public static fail<E>(error: E): Result<never, E> {
        return new Result<never, E>(false, undefined, error);
    }

    /**
     * Checks whether the result is successful.
     *
     * @returns `true` if the result is `ok`, otherwise `false`.
     *          Acts as a type guard to narrow the type to a successful result.
     */
    public isOk(): this is { _value: TValue } & Result<TValue, TError> {
        return this._isOk;
    }

    /**
     * Checks whether the result is a failure.
     *
     * @returns `true` if the result is `fail`, otherwise `false`.
     *          Acts as a type guard to narrow the type to a failed result.
     */
    public isFail(): this is { _error: TError } & Result<TValue, TError> {
        return !this._isOk;
    }

    /**
     * Gets the value inside a successful result.
     *
     * @throws If the result is a failure.
     * @returns The success value.
     */
    public get value(): TValue {
        if (!this._isOk) {
            throw new Error("Tried to get value from a failed Result.");
        }

        return this._value as TValue;
    }

    /**
     * Gets the error inside a failed result.
     *
     * @throws If the result is successful.
     * @returns The error value.
     */
    public get error(): TError {
        if (this._isOk) {
            throw new Error("Tried to get error from a successful Result.");
        }

        return this._error as TError;
    }

    /**
     * Transforms the success value using the provided mapping function.
     *
     * @template U - The type of the new success value.
     * @param fn - Function to apply to the value if the result is successful.
     * @returns A new `Result` containing the mapped value, or the original error if failed.
     */
    public map<U>(fn: (value: TValue) => U): Result<U, TError> {
        if (this.isOk()) {
            return Result.ok(fn(this._value as TValue));
        }

        return Result.fail(this._error as TError);
    }

    /**
     * Transforms the error value using the provided mapping function.
     *
     * @template F - The type of the new error.
     * @param fn - Function to apply to the error if the result is a failure.
     * @returns A new `Result` containing the original value or the mapped error.
     */
    public mapError<F>(fn: (error: TError) => F): Result<TValue, F> {
        if (this.isFail()) {
            return Result.fail(fn(this._error as TError));
        }

        return Result.ok(this._value as TValue);
    }

    /**
     * Chains another `Result`-producing function onto this result.
     * If this result is successful, the function is applied to the value.
     * If this result is a failure, the original error is returned.
     *
     * @template U - The type of the next success value.
     * @param fn - A function that takes the current value and returns another `Result`.
     * @returns A new `Result` from applying the function or the original failure.
     */
    public flatMap<U>(fn: (value: TValue) => Result<U, TError>): Result<U, TError> {
        if (this.isOk()) {
            return fn(this._value as TValue);
        }

        return Result.fail(this._error as TError);
    }

    /**
     * Pattern-matches the result to handle both success and failure cases.
     *
     * @template U - The return type of both match functions.
     * @param handlers - An object containing `ok` and `fail` handlers.
     * @returns The return value from the corresponding handler.
     */
    public match<U>(handlers: { ok: (value: TValue) => U; fail: (error: TError) => U }): U {
        if (this.isOk()) {
            return handlers.ok(this._value as TValue);
        }

        return handlers.fail(this._error as TError);
    }
}
```

```ts
// __tests__/ModelBuilder.test.ts
import { describe, it, expect } from "vitest";
import { createModelSchema, ModelBuilder } from "../ModelBuilder";
import type { IModel } from "~/models/abstractions.js";

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
```

```ts
// abstractions.ts
import { z } from "zod";
import type { ModelBuilder } from "~/models/ModelBuilder.js";
import { BaseModel, type IModelData } from "~/models/BaseModel.js";

export type { IModelInput, IModelData } from "~/models/BaseModel.js";

export type IModel<TSchema extends z.ZodObject<any>> = BaseModel<TSchema> & z.infer<TSchema>;

/**
 * Builder builds the model class (not an instance).
 * It knows both the schema and the public model interface.
 */
export interface IModelBuilder<TModel extends BaseModel<any>> {
    buildModel(): Promise<ModelBuilder<TModel>>;
}

/**
 * Factory creates model instances.
 * It directly produces the model with the correct schema and public interface.
 */
export interface IModelFactory<TModel extends BaseModel<any>> {
    create(data: IModelData<TModel>): Promise<TModel>;
}
```
