import { createAbstraction } from "@webiny/feature/api";
import type { IGroupEntity } from "~/definitions/types.js";

export const CmsDdbEsGroupEntity = createAbstraction<IGroupEntity>("Cms/DdbEs/GroupEntity");

export namespace CmsDdbEsGroupEntity {
    export type Interface = IGroupEntity;
}
