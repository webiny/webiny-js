import { createAbstraction } from "@webiny/feature/api";
import type { CmsGroupStorageOperations } from "~/types/index.js";

export const GroupStorageOperations =
    createAbstraction<CmsGroupStorageOperations>("Cms/GroupStorageOperations");

export namespace GroupStorageOperations {
    export type Interface = CmsGroupStorageOperations;
}
