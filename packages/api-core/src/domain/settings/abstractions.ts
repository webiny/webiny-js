import { createAbstraction } from "@webiny/feature/api";
import { createModelSchema } from "~/models/base/ModelBuilder.js";
import type {
    IModel,
    IModelBuilder,
    IModelFactory,
    IModelInput
} from "~/models/base/abstractions.js";

export const SettingsSchema = createModelSchema(z => ({
    name: z.string().min(1),
    data: z.record(z.string(), z.any())
}));

export interface ISettings extends IModel<typeof SettingsSchema> {}

export const SettingsModelFactory =
    createAbstraction<IModelFactory<ISettings>>("SettingsModelFactory");

export namespace SettingsModelFactory {
    export type Interface = IModelFactory<ISettings>;
    export type CreateInput = IModelInput<ISettings>;
}

export const SettingsModelBuilder =
    createAbstraction<IModelBuilder<ISettings>>("SettingsModelBuilder");

export namespace SettingsModelBuilder {
    export type Interface = IModelBuilder<ISettings>;
}
