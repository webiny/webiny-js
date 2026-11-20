import { createCacheKey } from "@webiny/utils";
import type { GlobalComponentLanguage } from "~/domain/globals/GlobalComponentLanguage.js";

/**
 * The entry id of a global component's record in one language, derived from its name and language.
 * A fixed id means two first saves of the same global can't each create a record: there is only ever
 * one entry per global component and language. Names may hold characters an entry id can't
 * (e.g. `Demo/Header`), so the id is a hash. `name` and `language` are also stored as fields.
 * A record with a scope gets its own id; one without keeps the id it always had.
 */
export class GlobalComponentEntryId {
    private readonly id: string;

    private constructor(id: string) {
        this.id = id;
    }

    static from(
        name: string,
        language: GlobalComponentLanguage,
        scope?: string | null
    ): GlobalComponentEntryId {
        const parts = scope ? [name, language.toString(), scope] : [name, language.toString()];
        return new GlobalComponentEntryId(`wbgc-${createCacheKey(parts).slice(-32)}`);
    }

    // Whether a stored entry lives at this id. Any other entry of the same name and language is a stray.
    matches(entryId: string): boolean {
        return entryId === this.id;
    }

    toString(): string {
        return this.id;
    }
}
