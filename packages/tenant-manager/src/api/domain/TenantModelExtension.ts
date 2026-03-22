import { createAbstraction } from "@webiny/feature/api";
import { IObjectFieldBuilder } from "@webiny/api-headless-cms/features/modelBuilder/fields/ObjectFieldType.js";

export type IExtension = Pick<IObjectFieldBuilder, "fields" | "layout">;

export interface ITenantModelExtension {
    execute(extension: IExtension): void;
}

/** Extend the tenant content model with custom fields. */
export const TenantModelExtension =
    createAbstraction<ITenantModelExtension>("TenantModelExtension");

export namespace TenantModelExtension {
    export type Interface = ITenantModelExtension;
    export type Extension = IExtension;
}
