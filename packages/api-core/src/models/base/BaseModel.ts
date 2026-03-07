import { Result } from "@webiny/feature/api";
import { WebinyError } from "@webiny/error";
import z from "zod";

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
        if (this.__schema && this.__schema._def?.type === "object") {
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
                data: result.error.issues
            });
        }
    }
}
