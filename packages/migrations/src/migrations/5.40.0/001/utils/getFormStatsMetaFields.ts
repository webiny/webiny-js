import { FbForm } from "../types";

export const getFormStatsMetaFields = (form: FbForm) => {
    return {
        /**
         * Entry-level meta fields. 👇
         */
        createdBy: form.createdBy,
        createdOn: form.createdOn,
        savedBy: form.createdBy,
        savedOn: form.savedOn,

        /**
         * Revision-level meta fields. 👇
         */
        revisionCreatedBy: form.createdBy,
        revisionCreatedOn: form.createdOn,
        revisionSavedBy: form.createdBy,
        revisionSavedOn: form.savedOn
    };
};
