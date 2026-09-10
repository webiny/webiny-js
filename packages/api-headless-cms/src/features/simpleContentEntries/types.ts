import type { CmsEntryValues, CmsIdentity } from "~/types/index.js";
import type {
    SIMPLE_ENTRY_EXPIRES_AT,
    SIMPLE_ENTRY_LOCKED,
    SIMPLE_ENTRY_STATUS,
    SIMPLE_ENTRY_VERSION
} from "./constants.js";

/**
 * A content entry reduced to what is actually needed: the storage operations' requirements plus
 * a creation stamp. The 26 remaining entry and revision meta fields are not stored.
 */
export interface ISimpleCmsEntry<TValues extends CmsEntryValues = CmsEntryValues> {
    /**
     * Always `<entryId>#0001`. The storage key builders run `parseIdentifier` over it, so the
     * revision suffix has to be present even though there is only ever one revision.
     */
    id: string;
    entryId: string;
    tenant: string;
    modelId: string;
    createdOn: string;
    createdBy: CmsIdentity;
    values: TValues;
    /*
     * Pinned. Literal types rather than `number`/`string`/`boolean` so that writing anything else
     * is a compile error instead of a surprise at runtime.
     */
    version: typeof SIMPLE_ENTRY_VERSION;
    status: typeof SIMPLE_ENTRY_STATUS;
    locked: typeof SIMPLE_ENTRY_LOCKED;
    expiresAt: typeof SIMPLE_ENTRY_EXPIRES_AT;
}

export interface ICreateSimpleEntryInput<TValues extends CmsEntryValues = CmsEntryValues> {
    id?: string;
    values: TValues;
}

export interface IUpdateSimpleEntryInput<TValues extends CmsEntryValues = CmsEntryValues> {
    values: TValues;
}

export interface ISimpleEntryWhere {
    id?: string;
    entryId?: string;
}

export interface IGetSimpleEntryParams {
    where: ISimpleEntryWhere;
}

/**
 * Sorting is not `string[]`. A simple model gets its own OpenSearch index, so every meta field
 * this shape drops is unmapped there and sorting on one fails at query time. Only fields the
 * entry actually carries can be sorted on.
 */
export type SimpleEntrySortableField = "id" | "createdOn" | `values.${string}`;

export type SimpleEntrySort = `${SimpleEntrySortableField}_${"ASC" | "DESC"}`;

export interface IListSimpleEntriesParams {
    where?: ISimpleEntryWhere;
    sort?: SimpleEntrySort[];
    limit?: number;
    after?: string | null;
}

export interface IListSimpleEntriesMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface IListSimpleEntriesResult<TValues extends CmsEntryValues = CmsEntryValues> {
    items: ISimpleCmsEntry<TValues>[];
    meta: IListSimpleEntriesMeta;
}
