import { FbForm } from "../types";
import { CmsIdentity } from "@webiny/api-headless-cms/types";

interface SpecialFields {
    createdOn: string;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;
    firstPublishedBy: CmsIdentity | null;
    lastPublishedBy: CmsIdentity | null;
}

export const getMetaFields = (form: FbForm, specialFields: SpecialFields) => {
    const isDraft = form.status === "draft";

    // We don't have `publishedBy`, that's why we're relying on `modifiedBy` or `createdBy`.
    const revisionFirstLastPublishedOn = isDraft ? null : specialFields.firstPublishedOn || null;
    const revisionFirstLastPublishedBy = isDraft
        ? null
        : specialFields.firstPublishedBy || form.createdBy;

    return {
        // Revision-level meta fields.
        revisionCreatedOn: form.createdOn,

        // `modifiedOn` does not exist, that's why we're using `savedOn`.
        revisionModifiedOn: form.savedOn,

        revisionSavedOn: form.savedOn,
        revisionCreatedBy: form.createdBy,
        revisionModifiedBy: form.createdBy,
        revisionSavedBy: form.createdBy,

        revisionFirstPublishedOn: revisionFirstLastPublishedOn,
        revisionFirstPublishedBy: revisionFirstLastPublishedBy,

        revisionLastPublishedOn: revisionFirstLastPublishedOn,
        revisionLastPublishedBy: revisionFirstLastPublishedBy,

        // Entry-level meta fields.
        createdOn: specialFields.createdOn,

        // `modifiedOn` does not exist, that's why we're using `savedOn`.
        modifiedOn: form.savedOn,

        savedOn: form.savedOn,
        createdBy: form.createdBy,
        modifiedBy: form.createdBy,
        savedBy: form.createdBy,

        firstPublishedOn: specialFields.firstPublishedOn,
        firstPublishedBy: specialFields.firstPublishedBy,

        lastPublishedOn: specialFields.lastPublishedOn,
        lastPublishedBy: specialFields.lastPublishedBy
    };
};
