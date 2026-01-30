import { ModelBuilder, ModelFactory } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { createAbstraction } from "@webiny/feature/api";

export type PublicModelBuilder = ReturnType<ModelBuilder["public"]>;

type ModelModifier = Pick<PublicModelBuilder, "fields" | "layout">;

export interface ITenantModelModifier {
    execute(model: ModelModifier): Promise<ModelFactory.Builder>;
}

export const TenantModelModifier = createAbstraction<ITenantModelModifier>("TenantModelModifier");

export namespace TenantModelModifier {
    export type Interface = ITenantModelModifier;
    export type Return = Promise<ModelFactory.Builder>;
}
