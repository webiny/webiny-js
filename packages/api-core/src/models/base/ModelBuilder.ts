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
