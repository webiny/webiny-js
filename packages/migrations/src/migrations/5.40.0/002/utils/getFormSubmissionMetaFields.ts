import { FbSubmission } from "../types";

export const getFormSubmissionMetaFields = (submission: FbSubmission) => {
    return {
        /**
         * Entry-level meta fields. 👇
         */
        createdBy: submission.ownedBy,
        createdOn: submission.createdOn,
        savedBy: submission.ownedBy,
        savedOn: submission.savedOn,

        /**
         * Revision-level meta fields. 👇
         */
        revisionCreatedBy: submission.ownedBy,
        revisionCreatedOn: submission.createdOn,
        revisionSavedBy: submission.ownedBy,
        revisionSavedOn: submission.savedOn
    };
};
