import { CmsEntry } from "~/types";

// TODO: check this, why do we need this?
export const commonFieldResolvers = () => ({
    id: (entry: CmsEntry) => entry.id || null,
    createdBy: (entry: CmsEntry) => entry.createdBy || null,
    ownedBy: (entry: CmsEntry) => entry.ownedBy || null,
    modifiedBy: (entry: CmsEntry) => entry.modifiedBy || null
});
