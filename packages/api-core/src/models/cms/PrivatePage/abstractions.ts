import { Abstraction } from "@webiny/di-container";
import type { IModel, IModelData } from "~/models/base/abstractions.js";
import type { ICmsModelBuilder, ICmsModelFactory } from "~/models/cms/abstractions.js";
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
