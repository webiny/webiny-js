import { createAbstraction } from "@webiny/feature/api";
import type { IModelEntity } from "~/definitions/types.js";

export const CmsDdbModelEntity = createAbstraction<IModelEntity>("Cms/Ddb/ModelEntity");

export namespace CmsDdbModelEntity {
    export type Interface = IModelEntity;
}
