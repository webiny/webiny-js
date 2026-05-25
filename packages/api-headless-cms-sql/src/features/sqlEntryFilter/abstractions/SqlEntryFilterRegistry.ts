import { createAbstraction } from "@webiny/feature/api/index.js";
import type { SqlEntryFilter } from "./SqlEntryFilter.js";

export interface ISqlEntryFilterRegistry {
    get(fieldType: string): SqlEntryFilter.Interface;
}

export const SqlEntryFilterRegistry = createAbstraction<ISqlEntryFilterRegistry>(
    "Cms/Sql/EntryFilterRegistry"
);

export namespace SqlEntryFilterRegistry {
    export type Interface = ISqlEntryFilterRegistry;
}
