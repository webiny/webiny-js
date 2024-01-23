import { FbForm, Status } from "~/migrations/5.40.0/001/types";

export const createRevisionStatus = (revision: FbForm, published: FbForm | null): Status => {
    // If published entry is not provided OR the revision id differs from the published id
    if (!published || revision.id !== published.id) {
        // If the revision is locked: this means the revision has been published and unpublished
        if (revision.locked) {
            return Status.UNPUBLISHED;
        }

        // else the revision is in draft
        return Status.DRAFT;
    }

    // Return published
    return Status.PUBLISHED;
};
