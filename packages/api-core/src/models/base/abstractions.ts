import { z } from "zod";
import type { ModelBuilder } from "./ModelBuilder.js";
import { BaseModel, type IModelData } from "./BaseModel.js";

export type { IModelInput, IModelData } from "./BaseModel.js";

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
