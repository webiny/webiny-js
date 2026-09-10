import { createAbstraction } from "@webiny/feature/api";
import type { IModelEntity } from "~/definitions/types.js";

export const CmsDdbEsModelEntity = createAbstraction<IModelEntity>("Cms/DdbEs/ModelEntity");

export namespace CmsDdbEsModelEntity {
    export type Interface = IModelEntity;
}
