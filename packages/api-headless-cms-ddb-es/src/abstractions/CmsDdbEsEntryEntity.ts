import { createAbstraction } from "@webiny/feature/api";
import type { IEntryEntity } from "~/definitions/types.js";

export const CmsDdbEsEntryEntity = createAbstraction<IEntryEntity>("Cms/DdbEs/EntryEntity");

export namespace CmsDdbEsEntryEntity {
    export type Interface = IEntryEntity;
}
