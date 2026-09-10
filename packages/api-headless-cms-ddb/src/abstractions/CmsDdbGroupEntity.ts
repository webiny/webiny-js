import { createAbstraction } from "@webiny/feature/api";
import type { IGroupEntity } from "~/definitions/types.js";

export const CmsDdbGroupEntity = createAbstraction<IGroupEntity>("Cms/Ddb/GroupEntity");

export namespace CmsDdbGroupEntity {
    export type Interface = IGroupEntity;
}
