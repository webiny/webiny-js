import { CmsContentEntry } from "~/types";

export const commonFieldResolvers = () => ({
    id: (entry: CmsContentEntry) => entry.id || null,
    createdBy: (entry: CmsContentEntry) => entry.createdBy || null,
    ownedBy: (entry: CmsContentEntry) => entry.ownedBy || null
});
