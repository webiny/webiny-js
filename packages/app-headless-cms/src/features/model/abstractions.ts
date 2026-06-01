import { createAbstraction } from "@webiny/feature/admin";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { CmsModel } from "~/types.js";

export const ModelsCache = createAbstraction<IListCache<CmsModel>>("ModelsCache");

export namespace ModelsCache {
    export type Interface = IListCache<CmsModel>;
}
