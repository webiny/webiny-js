import type { CmsEntryValues, CmsIdentity, CmsModel } from "~/types/index.js";
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
     * Pinned and readonly. A simple entry is always a single unpublished draft: literal types make
     * writing any other value a compile error, and `readonly` makes reassigning one a compile error
     * too. assertSimpleEntryInvariants enforces the same thing at runtime.
     */
    readonly version: typeof SIMPLE_ENTRY_VERSION;
    readonly status: typeof SIMPLE_ENTRY_STATUS;
    readonly locked: typeof SIMPLE_ENTRY_LOCKED;
    readonly expiresAt: typeof SIMPLE_ENTRY_EXPIRES_AT;
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

/**
 * The simple entry CRUD surface on the HeadlessCms facade. Reached through code; there is no
 * GraphQL layer for simple entries.
 */
export interface ICmsSimpleEntryContext {
    simpleCreateEntry<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        input: ICreateSimpleEntryInput<TValues>
    ): Promise<ISimpleCmsEntry<TValues>>;
    simpleUpdateEntry<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        input: IUpdateSimpleEntryInput<TValues>
    ): Promise<ISimpleCmsEntry<TValues>>;
    simpleGetEntry<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: IGetSimpleEntryParams
    ): Promise<ISimpleCmsEntry<TValues>>;
    simpleListEntries<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params?: IListSimpleEntriesParams
    ): Promise<IListSimpleEntriesResult<TValues>>;
    simpleDeleteEntry(model: CmsModel, id: string): Promise<void>;
}
