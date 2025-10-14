import { Abstraction } from "@webiny/di-container";
import { createModelSchema } from "~/models/ModelBuilder.js";
import type { IModel, IModelBuilder, IModelFactory, IModelInput } from "~/models/abstractions.js";

export const PageSchema = createModelSchema(z => ({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    publishedAt: z.date().nullable()
}));

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IPageExtensions {}

export interface IPage extends IModel<typeof PageSchema> {
    hasTitle(): boolean;
    cancel(): void;
    bokPavel(): void;
    extensions?: IPageExtensions;
}

export const PageModelFactory = new Abstraction<IModelFactory<IPage>>("PageModelFactory");

export namespace PageModelFactory {
    export type Interface = IModelFactory<IPage>;
    export type CreateInput = IModelInput<IPage>;
}

export const PageModelBuilder = new Abstraction<IModelBuilder<IPage>>("PageModelBuilder");

export namespace PageModelBuilder {
    export type Interface = IModelBuilder<IPage>;
}
