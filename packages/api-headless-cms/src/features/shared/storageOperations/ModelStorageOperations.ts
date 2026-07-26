import { createAbstraction } from "@webiny/feature/api";
import type { CmsModelStorageOperations } from "~/types/types.js";

export const ModelStorageOperations =
    createAbstraction<CmsModelStorageOperations>("Cms/ModelStorageOperations");

export namespace ModelStorageOperations {
    export type Interface = CmsModelStorageOperations;
}
