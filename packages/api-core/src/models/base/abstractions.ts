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
