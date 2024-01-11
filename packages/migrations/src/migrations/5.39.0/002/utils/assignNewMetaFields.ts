import { CmsEntry } from "../types";

const isPublished = (entry: CmsEntry) => {
    return entry.status === "published";
};

export const assignNewMetaFields = (entry: CmsEntry, extraOverrides: Partial<CmsEntry> = {}) => {
    const firstLastPublishedOn = isPublished(entry) ? entry.publishedOn : null;
    // We don't have `publishedBy`, that's why we're relying on `modifiedBy` or `createdBy`.
    const firstLastPublishedBy = isPublished(entry) ? entry.modifiedBy || entry.createdBy : null;

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

            revisionFirstPublishedOn: firstLastPublishedOn,
            revisionFirstPublishedBy: firstLastPublishedBy,

            revisionLastPublishedOn: firstLastPublishedOn,
            revisionLastPublishedBy: firstLastPublishedBy,

            // Entry-level meta fields.
            createdOn: entry.createdOn,

            // `modifiedOn` does not exist, that's why we're using `savedOn`.
            // We only use it if there's a `modifiedBy` set.
            modifiedOn: entry.modifiedBy ? entry.savedOn : null,

            savedOn: entry.savedOn,
            createdBy: entry.ownedBy,
            modifiedBy: entry.modifiedBy || null,
            savedBy: entry.modifiedBy || entry.createdBy,

            firstPublishedOn: firstLastPublishedOn,
            firstPublishedBy: firstLastPublishedBy,

            lastPublishedOn: firstLastPublishedOn,
            lastPublishedBy: firstLastPublishedBy
        },
        extraOverrides
    );
};
