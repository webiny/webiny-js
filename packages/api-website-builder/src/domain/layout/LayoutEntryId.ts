import { createCacheKey, parseIdentifier } from "@webiny/utils";
import { EntryId } from "@webiny/api-headless-cms/exports/api/cms/entry.js";

/**
 * The entry id of a layout.
 */
export class LayoutEntryId {
    private readonly id: string;

    private constructor(id: string) {
        this.id = id;
    }

    // From a layout's entry id or one of its revision ids (e.g. `abc#0001`).
    static from(id: string): LayoutEntryId {
        return new LayoutEntryId(EntryId.from(id).id);
    }

    // Whether the id names one revision of a layout (e.g. `abc#0001`) rather than the layout itself.
    static isRevisionId(id: string): boolean {
        return parseIdentifier(id).version !== null;
    }

    /**
     * The entry id of this source layout's version in one language, derived from the source's entry id and the
     * language. A fixed id means there is only ever one version per source and language, and a page's layout
     * in its language is read without a search.
     */
    versionIn(language: string): LayoutEntryId {
        return new LayoutEntryId(`wbl-${createCacheKey([this.id, language]).slice(-32)}`);
    }

    toString(): string {
        return this.id;
    }
}
