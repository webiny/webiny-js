import { createAbstraction } from "@webiny/feature/admin";
import type { CmsReferenceEntry, CmsReferenceValue } from "../refTypes.js";

export interface IReferenceTitles {
    /**
     * The title of the referenced entry, or `undefined` until it is known. Observable: an unknown
     * reference is queued and loaded in one request with every other reference asked for in the
     * same tick, so a list of fifty accordion items costs one round trip. A reference to an entry
     * that no longer exists settles as an empty string.
     */
    getTitle(ref: CmsReferenceValue): string | undefined;
    /** Record the titles of entries loaded elsewhere, so they are never fetched again. */
    remember(entries: CmsReferenceEntry[]): void;
}

export const ReferenceTitles = createAbstraction<IReferenceTitles>("CmsReferenceTitles");

export namespace ReferenceTitles {
    export type Interface = IReferenceTitles;
}
