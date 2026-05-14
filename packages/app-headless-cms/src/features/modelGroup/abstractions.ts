import { createAbstraction } from "@webiny/feature/admin";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { ModelGroupDto } from "./listModelGroups/abstractions.js";

export const ModelGroupsCache = createAbstraction<IListCache<ModelGroupDto>>("ModelGroupsCache");

export namespace ModelGroupsCache {
    export type Interface = IListCache<ModelGroupDto>;
}
