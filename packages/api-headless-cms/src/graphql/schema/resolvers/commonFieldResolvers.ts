import { CmsEntry } from "~/types";

export const commonFieldResolvers = () => ({
    id: (entry: CmsEntry) => entry.id || null,
    createdBy: (entry: CmsEntry) => entry.createdBy || null,
    ownedBy: (entry: CmsEntry) => entry.ownedBy || null
});
