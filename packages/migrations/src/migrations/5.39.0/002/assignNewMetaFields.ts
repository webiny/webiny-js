import { CmsEntry } from "./types";

export const assignNewMetaFields = (entry: CmsEntry) => {
    Object.assign(entry, {
        // Revision-level meta fields.
        revisionCreatedOn: entry.createdOn,

        // `modifiedOn` does not exist, that's why we're using `savedOn`.
        // We only use it if there's a `modifiedBy` set.
        revisionModifiedOn: entry.modifiedBy ? entry.savedOn : null,

        revisionSavedOn: entry.savedOn,
        revisionCreatedBy: entry.createdBy,
        revisionModifiedBy: entry.modifiedBy || null,
        revisionSavedBy: entry.modifiedBy || entry.createdBy,

        // We don't have `publishedBy`, that's why we're relying on `modifiedBy` or `createdBy`.
        revisionFirstPublishedOn: entry.publishedOn || null,
        revisionFirstPublishedBy: entry.modifiedBy || entry.createdBy,

        // We don't have `publishedBy`, that's why we're relying on `modifiedBy` or `createdBy`.
        revisionLastPublishedOn: entry.publishedOn || null,
        revisionLastPublishedBy: entry.modifiedBy || entry.createdBy,

        // Revision-level meta fields.
        entryCreatedOn: entry.createdOn,

        // `modifiedOn` does not exist, that's why we're using `savedOn`.
        // We only use it if there's a `modifiedBy` set.
        entryModifiedOn: entry.modifiedBy ? entry.savedOn : null,

        entrySavedOn: entry.savedOn,
        entryCreatedBy: entry.ownedBy,
        entryModifiedBy: entry.modifiedBy || null,
        entrySavedBy: entry.modifiedBy || entry.createdBy,

        // We don't have `publishedBy`, that's why we're relying on `modifiedBy` or `createdBy`.
        entryFirstPublishedOn: entry.publishedOn || null,
        entryFirstPublishedBy: entry.modifiedBy || entry.createdBy,

        // We don't have `publishedBy`, that's why we're relying on `modifiedBy` or `createdBy`.
        entryLastPublishedOn: entry.publishedOn || null,
        entryLastPublishedBy: entry.modifiedBy || entry.createdBy
    });
};
