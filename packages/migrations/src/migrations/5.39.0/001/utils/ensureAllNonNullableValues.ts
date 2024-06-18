import { CmsEntry } from "~/migrations/5.39.0/001/types";
import { CmsIdentity } from "@webiny/api-headless-cms/types";

interface Fallbacks {
    dateTime: string;
    identity: CmsIdentity;
}

// All non-nullable meta fields must have values assigned.
export const ensureAllNonNullableValues = (entry: CmsEntry, fallbacks: Fallbacks) => {
    const entryFallbackDateTime =
        entry.savedOn ||
        entry.modifiedOn ||
        entry.createdOn ||
        entry.revisionCreatedOn ||
        entry.revisionModifiedOn ||
        entry.revisionSavedOn ||
        fallbacks.dateTime;

    const entryFallbackIdentity =
        entry.savedBy ||
        entry.modifiedBy ||
        entry.createdBy ||
        entry.revisionCreatedBy ||
        entry.revisionModifiedBy ||
        entry.revisionSavedBy ||
        fallbacks.identity;

    if (!entry.revisionCreatedOn) {
        entry.revisionCreatedOn = entryFallbackDateTime;
    }

    if (!entry.revisionSavedOn) {
        entry.revisionSavedOn = entryFallbackDateTime;
    }

    if (!entry.revisionCreatedBy) {
        entry.revisionCreatedBy = entryFallbackIdentity;
    }

    if (!entry.revisionSavedBy) {
        entry.revisionSavedBy = entryFallbackIdentity;
    }

    if (!entry.createdOn) {
        entry.createdOn = entryFallbackDateTime;
    }

    if (!entry.savedOn) {
        entry.savedOn = entryFallbackDateTime;
    }

    if (!entry.createdBy) {
        entry.createdBy = entryFallbackIdentity;
    }

    if (!entry.savedBy) {
        entry.savedBy = entryFallbackIdentity;
    }
};
