import { CmsEntry } from "../types";
import { CmsIdentity } from "@webiny/api-headless-cms/types";

interface SpecialFields {
    createdOn: string;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;
    firstPublishedBy: CmsIdentity | null;
    lastPublishedBy: CmsIdentity | null;
}

export const assignNewMetaFields = (entry: CmsEntry, specialFields: SpecialFields) => {
    const isDraft = entry.status === "draft";

    // We don't have `publishedBy`, that's why we're relying on `modifiedBy` or `createdBy`.
    const revisionFirstLastPublishedOn = isDraft ? null : entry.publishedOn || null;
    const revisionFirstLastPublishedBy = isDraft ? null : entry.modifiedBy || entry.createdBy;

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

        revisionFirstPublishedOn: revisionFirstLastPublishedOn,
        revisionFirstPublishedBy: revisionFirstLastPublishedBy,

        revisionLastPublishedOn: revisionFirstLastPublishedOn,
        revisionLastPublishedBy: revisionFirstLastPublishedBy,

        // Entry-level meta fields.
        createdOn: specialFields.createdOn,

        // `modifiedOn` does not exist, that's why we're using `savedOn`.
        // We only use it if there's a `modifiedBy` set.
        modifiedOn: entry.modifiedBy ? entry.savedOn : null,

        savedOn: entry.savedOn,
        createdBy: entry.ownedBy,
        modifiedBy: entry.modifiedBy || null,
        savedBy: entry.modifiedBy || entry.createdBy,

        firstPublishedOn: specialFields.firstPublishedOn,
        firstPublishedBy: specialFields.firstPublishedBy,

        lastPublishedOn: specialFields.lastPublishedOn,
        lastPublishedBy: specialFields.lastPublishedBy
    });
};
