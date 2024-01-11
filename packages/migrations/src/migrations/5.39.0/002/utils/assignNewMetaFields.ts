import { CmsEntry } from "../types";

export const assignNewMetaFields = (entry: CmsEntry, extraOverrides: Partial<CmsEntry> = {}) => {
    Object.assign(
        entry,
        {
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

            // Entry-level meta fields.
            createdOn: entry.createdOn,

            // `modifiedOn` does not exist, that's why we're using `savedOn`.
            // We only use it if there's a `modifiedBy` set.
            modifiedOn: entry.modifiedBy ? entry.savedOn : null,

            savedOn: entry.savedOn,
            createdBy: entry.ownedBy,
            modifiedBy: entry.modifiedBy || null,
            savedBy: entry.modifiedBy || entry.createdBy,

            // We don't have `publishedBy`, that's why we're relying on `modifiedBy` or `createdBy`.
            firstPublishedOn: entry.publishedOn || null,
            firstPublishedBy: entry.modifiedBy || entry.createdBy,

            // We don't have `publishedBy`, that's why we're relying on `modifiedBy` or `createdBy`.
            lastPublishedOn: entry.publishedOn || null,
            lastPublishedBy: entry.modifiedBy || entry.createdBy
        },
        extraOverrides
    );
};
