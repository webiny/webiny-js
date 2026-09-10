import { createAbstraction } from "@webiny/feature/api";
import type { IEntryEntity } from "~/definitions/types.js";

export const CmsDdbEntryEntity = createAbstraction<IEntryEntity>("Cms/Ddb/EntryEntity");

export namespace CmsDdbEntryEntity {
    export type Interface = IEntryEntity;
}
