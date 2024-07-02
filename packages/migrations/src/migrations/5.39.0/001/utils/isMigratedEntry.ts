import { CmsEntry } from "../types";

export const isMigratedEntry = (entry: CmsEntry) => {
    return "revisionCreatedOn" in entry && entry.revisionCreatedOn;
};
