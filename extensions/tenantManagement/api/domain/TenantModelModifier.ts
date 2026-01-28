import { createAbstraction } from "webiny/api";
import { ModelFactory } from "webiny/api/cms/model";
import { ModelBuilder } from "webiny/api/cms/model";

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
