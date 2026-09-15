import {
    SIMPLE_ENTRY_EXPIRES_AT,
    SIMPLE_ENTRY_LOCKED,
    SIMPLE_ENTRY_STATUS,
    SIMPLE_ENTRY_VERSION
} from "~/features/simpleContentEntries/constants.js";
import { SimpleEntryInvariantError } from "~/features/simpleContentEntries/domain/errors/index.js";
import type { ISimpleCmsEntry } from "~/features/simpleContentEntries/types.js";

/**
 * A simple entry is always a single unpublished draft. It is never published and never locked,
 * because there is nothing that could publish or lock it: the regular publishing operations refuse
 * a simple model, and no simple operation offers it.
 *
 * Called from the write repositories, the last layer before a storage operation stores the data, so
 * no caller can persist an entry that breaks the invariant - not through CRUD, not through a use
 * case resolved straight from the container.
 */
export const assertSimpleEntryInvariants = (entry: ISimpleCmsEntry): void => {
    if (entry.status !== SIMPLE_ENTRY_STATUS) {
        throw new SimpleEntryInvariantError("status", entry.status, SIMPLE_ENTRY_STATUS);
    }
    if (entry.locked !== SIMPLE_ENTRY_LOCKED) {
        throw new SimpleEntryInvariantError("locked", entry.locked, SIMPLE_ENTRY_LOCKED);
    }
    if (entry.version !== SIMPLE_ENTRY_VERSION) {
        throw new SimpleEntryInvariantError("version", entry.version, SIMPLE_ENTRY_VERSION);
    }
    if (entry.expiresAt !== SIMPLE_ENTRY_EXPIRES_AT) {
        throw new SimpleEntryInvariantError("expiresAt", entry.expiresAt, SIMPLE_ENTRY_EXPIRES_AT);
    }
};
