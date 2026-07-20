import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsGetParams
} from "@webiny/api-headless-cms/types/index.js";
import type { SearchOperationDeps } from "./types.js";
import { createListOperation } from "./list.js";

export const createGetOperation = (deps: SearchOperationDeps) => {
    const list = createListOperation(deps);

    return async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        getParams: CmsEntryStorageOperationsGetParams
    ): Promise<CmsEntry<T> | null> => {
        const { items } = await list<T>(initialModel, { ...getParams, limit: 1 });
        return items.shift() || null;
    };
};
