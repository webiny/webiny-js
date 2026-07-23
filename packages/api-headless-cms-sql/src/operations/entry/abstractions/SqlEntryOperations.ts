import { createAbstraction } from "@webiny/feature/api/index.js";
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";

export const SqlEntryOperations =
    createAbstraction<CmsEntryStorageOperations>("Cms/Sql/EntryOperations");

export namespace SqlEntryOperations {
    export type Interface = CmsEntryStorageOperations;
}
