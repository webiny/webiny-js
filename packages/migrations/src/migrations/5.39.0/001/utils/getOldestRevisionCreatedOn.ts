import { createDdbEntryEntity } from "./../entities/createEntryEntity";
import { CmsEntry } from "../types";

const cachedEntryCreatedOn: Record<string, string> = {};

interface CmsEntryWithPK extends CmsEntry {
    PK: string;
}

export interface GetOldestRevisionCreatedOnParams {
    entry: CmsEntryWithPK;
    entryEntity: ReturnType<typeof createDdbEntryEntity>;
}

export const getOldestRevisionCreatedOn = async (params: GetOldestRevisionCreatedOnParams) => {
    const { entry, entryEntity } = params;

    if (cachedEntryCreatedOn[entry.PK]) {
        return cachedEntryCreatedOn[entry.PK];
    }

    if (entry.version === 1) {
        cachedEntryCreatedOn[entry.PK] = entry.createdOn;
    } else {
        const result = await entryEntity.query(entry.PK, {
            limit: 1,
            beginsWith: "REV#",
            attributes: ["createdOn"]
        });

        const oldestRevision = result.Items?.[0];
        if (oldestRevision) {
            cachedEntryCreatedOn[entry.PK] = oldestRevision.createdOn;
        }
    }

    return cachedEntryCreatedOn[entry.PK];
};
